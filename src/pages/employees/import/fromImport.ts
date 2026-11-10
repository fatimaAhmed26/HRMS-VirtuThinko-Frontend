// Turns an imported form (AI answers) into the Add employee form, and works out which fields to check
import type { ImportedForm } from '../../../api/scanner';
import type { ClientCompany, Department, EmployeeListItem } from '../../../types';
import {
  CHECKLIST, emptyCertification, emptyDependant, emptyEducation, emptyEmployer, initialForm,
  type ChecklistKey, type OnboardingForm,
} from '../onboarding/formState';

export interface ImportResult {
  form: OnboardingForm;
  files: Partial<Record<ChecklistKey, File>>;
  checks: Record<string, string>; // form field → why HR should look at it
  fileName: string;
}

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();

// "Hussain Ali" → the employee whose first + last name match (or contain each other)
function findByName<T>(items: T[], name: string, label: (t: T) => string) {
  const n = norm(name);
  return items.find((i) => norm(label(i)) === n) ?? items.find((i) => norm(label(i)).includes(n) || n.includes(norm(label(i))));
}

function base64ToFile(data: string, name: string, mime: string) {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export function fromImport(imp: ImportedForm, lists: { departments: Department[]; managers: EmployeeListItem[]; clients: ClientCompany[] }): ImportResult {
  const form = initialForm();
  const checks: Record<string, string> = {};
  const writable = form as unknown as Record<string, unknown>;

  // plain answers with the same name in the form
  for (const [key, value] of Object.entries(imp.fields)) {
    if (!(key in form)) continue;
    const current = writable[key];
    if (typeof current === 'string' && typeof value === 'string') writable[key] = value;
    if (typeof current === 'boolean' && typeof value === 'boolean') writable[key] = value;
  }
  if (form.childrenCount && !/^\d{1,2}$/.test(form.childrenCount)) { checks.childrenCount = `Read as "${form.childrenCount}"`; form.childrenCount = '0'; }
  if (form.cprNumber) form.cprNumber = form.cprNumber.replace(/\D/g, '');
  if (form.employedBy !== 'BH' && form.employedBy !== 'SA') form.employedBy = 'BH';

  // names on the form → records in the portal
  const f = imp.fields;
  if (typeof f.departmentName === 'string') {
    const dep = findByName(lists.departments, f.departmentName, (d) => d.name);
    if (dep) form.departmentId = String(dep.id);
    else checks.departmentId = `"${f.departmentName}" is not a department in the portal`;
  }
  if (typeof f.managerName === 'string') {
    const m = findByName(lists.managers, f.managerName, (e) => `${e.firstName} ${e.lastName}`);
    if (m) form.managerId = String(m.id);
    else checks.managerId = `"${f.managerName}" was not found among active employees`;
  }
  if (typeof f.clientName === 'string') {
    const c = findByName(lists.clients, f.clientName, (x) => x.name);
    if (c) form.clientCompanyId = String(c.id);
    else checks.clientCompanyId = `"${f.clientName}" is not in the client list`;
  }

  // the portal first / last name from the passport name
  const words = form.fullNamePassport.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const title = (w: string) => (w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w); // "HASAN" → "Hasan"
    form.firstName = title(words[0]).slice(0, 50);
    form.lastName = title(words[words.length - 1]).slice(0, 50);
  }

  // repeating sections
  const rel = ['Spouse', 'Son', 'Daughter', 'Parent', 'Other'];
  form.dependants = imp.dependants.filter((d) => d.fullName).map((d) => ({
    ...emptyDependant(), ...d, relationship: (rel.includes(d.relationship) ? d.relationship : 'Other') as OnboardingForm['dependants'][number]['relationship'],
  }));
  const edu = imp.education.filter((q) => q.title).map((q) => ({ ...emptyEducation(), ...q, year: /^\d{4}$/.test(q.year ?? '') ? q.year : '' }));
  form.education = edu.length ? edu : [emptyEducation()];
  form.certifications = imp.certifications.filter((c) => c.title).map((c) => ({ ...emptyCertification(), ...c }));
  const emp = imp.employers.filter((p) => p.employerName).slice(0, 3).map((p) => ({ ...emptyEmployer(), ...p }));
  form.employers = emp.length ? emp : [emptyEmployer()];

  // what the AI flagged
  for (const c of imp.check) {
    const key = c.field === 'departmentName' ? 'departmentId' : c.field === 'managerName' ? 'managerId' : c.field === 'clientName' ? 'clientCompanyId' : c.field;
    checks[key] = checks[key] ? `${checks[key]}; ${c.reason}` : c.reason;
  }

  // section 11 rows ticked N/A, and the notice-period details kept in HR remarks
  for (const key of imp.checklistNotApplicable) {
    if (CHECKLIST.some((c) => c.key === key)) form.checklist[key as ChecklistKey] = { na: true, received: false };
  }
  if (typeof f.restrictionDetails === 'string') {
    form.hrRemarks = [form.hrRemarks, `Non-compete / notice: ${f.restrictionDetails}`].filter(Boolean).join(' · ').slice(0, 500);
  }

  // pictures pasted in a Word form → the documents checklist
  const files: Partial<Record<ChecklistKey, File>> = {};
  const keys = CHECKLIST.map((c) => c.key) as string[];
  // a ticked N/A loses to an actual picture of that document
  for (const a of imp.attachments) {
    if (!a.picture || !keys.includes(a.kind) || files[a.kind as ChecklistKey]) continue;
    files[a.kind as ChecklistKey] = base64ToFile(a.picture.data, `${a.kind}-${a.picture.name}`, a.picture.mime);
    delete form.checklist[a.kind as ChecklistKey];
  }

  return { form, files, checks, fileName: imp.fileName };
}
