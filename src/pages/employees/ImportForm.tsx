// Import completed form (design screens 16-17): upload a filled VTHR-ONB-F01 (Word / PDF / photo),
// check what was read (Filled / Check / Missing), then continue to Add employee with everything filled in
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Camera, FileText, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import * as scannerApi from '../../api/scanner';
import type { ImportedForm } from '../../api/scanner';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { shrinkImage } from '../../lib/image';
import { fromImport, type ImportResult } from './import/fromImport';
import { CHECKLIST, NATIONALITIES, validate, type OnboardingForm } from './onboarding/formState';

type Kind = 'text' | 'date' | { options: string[] } | 'department' | 'manager' | 'client' | 'entity';
type Row = [keyof OnboardingForm, string, Kind?];

const yn = { options: ['yes', 'no'] };
const SECTIONS: { title: string; rows: Row[] }[] = [
  { title: 'Employing entity', rows: [['team', 'Entity', 'entity'], ['clientCompanyId', 'Client company', 'client'], ['deploymentStart', 'Deployment start', 'date']] },
  { title: '1 Employment details', rows: [['jobTitle', 'Position / job title'], ['departmentId', 'Department / project', 'department'], ['hireDate', 'Date of joining', 'date'], ['managerId', 'Line manager', 'manager'], ['employmentType', 'Employment type', { options: ['Full-time', 'Part-time', 'Fixed-term', 'Contractor', 'Other'] }], ['email', 'Work email']] },
  { title: '2 Personal details', rows: [['fullNamePassport', 'Full name (as in passport)'], ['fullNameId', 'Full name (as in ID)'], ['fullNameArabic', 'Full name in Arabic'], ['firstName', 'First name (portal)'], ['lastName', 'Last name (portal)'], ['birthDate', 'Date of birth', 'date'], ['placeOfBirth', 'Place of birth'], ['nationality', 'Nationality', { options: NATIONALITIES }], ['gender', 'Gender', { options: ['Male', 'Female'] }], ['maritalStatus', 'Marital status', { options: ['Single', 'Married', 'Divorced', 'Widowed'] }], ['childrenCount', 'Number of children']] },
  { title: '3 Identification & residence', rows: [['cprNumber', 'CPR / ID / Iqama no.'], ['idExpiry', 'ID expiry', 'date'], ['passportNumber', 'Passport number'], ['passportPlaceOfIssue', 'Place of issue'], ['passportIssueDate', 'Passport issue date', 'date'], ['passportExpiry', 'Passport expiry', 'date'], ['permitNumber', 'Permit no.'], ['permitExpiry', 'Permit expiry', 'date']] },
  { title: '4 Contact details', rows: [['addressFlat', 'Flat / villa'], ['addressBuilding', 'Building'], ['addressRoad', 'Road'], ['addressBlock', 'Block'], ['addressCity', 'City / area'], ['addressCountry', 'Country'], ['phone', 'Mobile'], ['personalEmail', 'Personal email']] },
  { title: '5 Emergency contacts', rows: [['emergencyName', 'Contact 1 name'], ['emergencyRelationship', 'Contact 1 relationship'], ['emergencyPhone', 'Contact 1 phone'], ['emergency2Name', 'Contact 2 name'], ['emergency2Phone', 'Contact 2 phone']] },
  { title: '8 Previous employment', rows: [['mayContactEmployers', 'May we contact employers?', yn], ['hasRestrictiveClauses', 'Non-compete / notice obligation?', yn]] },
  { title: '9 Medical (confidential)', rows: [['hasMedicalCondition', 'Medical condition declared?', yn], ['medicalDetails', 'Details'], ['bloodGroup', 'Blood group']] },
  { title: '10 Salary payment', rows: [['bankName', 'Bank name'], ['bankBranch', 'Branch / country'], ['bankAccountHolder', 'Account holder'], ['bankAccountNumber', 'IBAN']] },
];
const ATTACH_LABEL = Object.fromEntries(CHECKLIST.map((c) => [c.key, c.label]));
const MUST_ATTACH = ['passport', 'nationalId', 'photo', 'iban'];

type Status = 'filled' | 'check' | 'missing' | 'empty';
const BADGE: Record<Status, string> = {
  filled: 'bg-green-50 text-green-700', check: 'bg-amber-100 text-amber-800', missing: 'bg-red-50 text-red-700', empty: 'bg-slate-100 text-slate-500',
};
const BADGE_TEXT: Record<Status, string> = { filled: 'Filled', check: 'Check', missing: 'Missing', empty: 'Not given' };

export default function ImportForm() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [imported, setImported] = useState<ImportedForm | null>(null);
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });
  const clients = useQuery({ queryKey: ['clients'], queryFn: orgApi.clients });
  const managers = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });
  const status = useQuery({ queryKey: ['scanner', 'status'], queryFn: scannerApi.status, staleTime: 60_000 });
  const notSetUp = status.data?.ready === false;
  const listsReady = departments.isSuccess && clients.isSuccess && managers.isSuccess && !notSetUp;

  const read = useMutation({
    mutationFn: scannerApi.importForm,
    onSuccess: (imp) => {
      setImported(imp);
      setResult(fromImport(imp, { departments: departments.data ?? [], managers: managers.data?.items ?? [], clients: clients.data ?? [] }));
    },
  });

  async function pick(file: File | undefined | null) {
    setPickError(null);
    if (!file) return;
    if (/\.doc$/i.test(file.name)) return setPickError('Old Word files (.doc) cannot be read. Save it as .docx or PDF first.');
    if (!/\.(docx|pdf|jpe?g|png|webp)$/i.test(file.name)) return setPickError('Use a Word (.docx) or PDF file, or a photo of the paper form');
    const ready = await shrinkImage(file, 2400, 0.9); // photos of paper forms need a little more detail
    if (ready.size > 20 * 1024 * 1024) return setPickError('The file is larger than 20 MB');
    setResult(null);
    read.mutate(ready);
  }

  function replace() {
    setResult(null);
    setImported(null);
    read.reset();
  }

  // header
  const header = (
    <div>
      <p className="text-xs text-slate-500">
        <Link to="/employees" className="hover:underline">Employee management</Link> / <Link to="/employees/new" className="hover:underline">Add employee</Link> / Import form
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">Import completed form</h1>
      <p className="mt-1 text-sm text-slate-500">Upload a filled VTHR-ONB-F01 form and every field is filled in for you to check.</p>
    </div>
  );

  // ── screen 16: upload ──
  if (!result || !imported) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        {header}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label
            className="flex min-h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-brand-400"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (listsReady) pick(e.dataTransfer.files[0]); }}
          >
            <Upload className="h-7 w-7 text-slate-400" />
            <span className="text-sm font-semibold text-slate-800">{read.isPending ? 'Reading every section of the form…' : 'Drag the completed form here'}</span>
            <span className="text-xs text-slate-500">{read.isPending ? 'This can take up to a minute' : 'Word (.docx), PDF, or a scan / photo of the paper form · up to 20 MB'}</span>
            {!read.isPending && (
              <span className="mt-2 flex flex-wrap justify-center gap-2">
                <span className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Choose file</span>
              </span>
            )}
            <input type="file" className="sr-only" accept=".docx,.pdf,.jpg,.jpeg,.png,.webp" aria-label="Choose completed form"
              disabled={read.isPending || !listsReady} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Camera className="h-4 w-4" /> Scan paper form
            <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={read.isPending || !listsReady}
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <ErrorMessage error={pickError || read.error || departments.error || managers.error || clients.error
            || (notSetUp ? 'Form import is not set up yet: add ANTHROPIC_API_KEY to the backend .env and restart it' : null)} />
          <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
            <li><b className="text-slate-700">1</b> Upload the form</li>
            <li><b className="text-slate-700">2</b> We read every section (1-12)</li>
            <li><b className="text-slate-700">3</b> You check flagged fields</li>
            <li><b className="text-slate-700">4</b> Create the employee</li>
          </ol>
          <p className="mt-3 text-xs text-slate-400">The form is sent to an AI service (Anthropic) only to read it. Nothing is saved until you add the employee.</p>
        </div>
      </div>
    );
  }

  // ── screen 17: review ──
  const form = result.form;
  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => setResult({ ...result, form: { ...form, [key]: value } });
  const errors = validate(form, { needSalary: false });
  const statusOf = (key: string): Status => {
    const v = form[key as keyof OnboardingForm];
    const err = errors[key];
    if (err && /required|Required|Choose/.test(err)) return 'missing';
    if (err || result.checks[key]) return 'check';
    return typeof v === 'string' && v.trim() ? 'filled' : 'empty';
  };
  const reasonOf = (key: string) => [result.checks[key], errors[key] && !/required|Required|Choose/.test(errors[key]!) ? errors[key] : null].filter(Boolean).join('; ');

  // client rows only matter for outsourced staff
  const OUTSOURCED_ONLY = ['clientCompanyId', 'deploymentStart'];
  const sections = SECTIONS.map((sec) => ({ ...sec, rows: sec.rows.filter(([k]) => form.team === 'OUT' || !OUTSOURCED_ONLY.includes(k)) }));
  const allRows = sections.flatMap((sec) => sec.rows.map((r) => r[0] as string));
  // required fields outside the review list still count as missing
  const extraMissing = Object.keys(errors).filter((k) => !allRows.includes(k) && /required/.test(errors[k]!));
  const counts = { filled: 0, check: 0, missing: extraMissing.length };
  allRows.forEach((k) => { const s = statusOf(k); if (s !== 'empty') counts[s]++; });

  const found = new Set(imported.attachments.map((a) => a.kind));
  const options = (kind: Kind): { value: string; label: string }[] | null => {
    if (kind === 'department') return (departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name }));
    if (kind === 'manager') return (managers.data?.items ?? []).map((m) => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }));
    if (kind === 'entity') return [{ value: 'BH', label: 'VirtuThinko W.L.L. (Bahrain)' }, { value: 'SA', label: 'VirtuThinko Company (KSA)' }, { value: 'OUT', label: 'Outsourced to client' }];
    if (kind === 'client') return (clients.data ?? []).map((c) => ({ value: String(c.id), label: c.name }));
    if (typeof kind === 'object') return kind.options.map((o) => ({ value: o, label: o }));
    return null;
  };

  function continueToForm() {
    navigate('/employees/new', { state: { imported: result } });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      {header}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold uppercase text-blue-700">{imported.kind}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{imported.fileName}</p>
          <p className="text-xs text-slate-500">
            Read just now{form.team && ` · employing entity: ${form.team === 'SA' ? 'VirtuThinko Company (KSA)' : form.team === 'OUT' ? 'Outsourced to client' : 'VirtuThinko W.L.L. (Bahrain)'}`}
          </p>
        </div>
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">{counts.filled} filled</span>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">{counts.check} to check</span>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">{counts.missing} missing</span>
        <Button variant="secondary" onClick={replace}>Replace file</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)]">
        <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Attachments found in the file</h2>
            <ul className="mt-2 space-y-1.5 text-xs">
              {[...new Set([...MUST_ATTACH, ...found])].filter((k) => k !== 'other').map((k) => (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className={clsx('h-2 w-2 rounded-full', found.has(k) ? 'bg-green-500' : 'bg-red-500')} />{ATTACH_LABEL[k] ?? k}
                  </span>
                  <span className="shrink-0 text-slate-500">{result.files[k as keyof typeof result.files] ? 'Attached' : found.has(k) ? 'Found' : 'Not attached'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">Pictures pasted in a Word form are added to the documents checklist. Others can be uploaded in Add employee.</p>
          </div>
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Also read</p>
            <p className="mt-1"><FileText className="mr-1 inline h-3.5 w-3.5" />{form.dependants.length} dependant(s), {form.education.filter((q) => q.title).length} qualification(s), {form.certifications.length} certification(s), {form.employers.filter((p) => p.employerName).length} previous employer(s)</p>
            <p className="mt-1">You can review them in Add employee.</p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex gap-2">
            {[false, true].map((v) => (
              <button key={String(v)} type="button" onClick={() => setOnlyAttention(v)}
                className={clsx('rounded-full border px-3 py-1 text-xs font-medium', onlyAttention === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600')}>
                {v ? `Needs attention (${counts.check + counts.missing})` : 'All fields'}
              </button>
            ))}
          </div>

          {sections.map((section) => {
            const rows = section.rows.filter(([k]) => !onlyAttention || ['check', 'missing'].includes(statusOf(k)));
            if (!rows.length) return null;
            const filled = section.rows.filter(([k]) => statusOf(k) === 'filled').length;
            return (
              <section key={section.title} className="rounded-xl border border-slate-200 bg-white">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
                  <span className="text-xs text-slate-500">{filled} of {section.rows.length} filled</span>
                </header>
                <div className="divide-y divide-slate-100">
                  {rows.map(([key, label, kind = 'text']) => {
                    const status = statusOf(key);
                    const value = form[key] as string;
                    const opts = options(kind);
                    const reason = reasonOf(key);
                    return (
                      <div key={key} className={clsx('px-4 py-2.5', status === 'check' && 'bg-amber-50/60', status === 'missing' && 'bg-red-50/40')}>
                        <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                          <span className="text-sm text-slate-600">{label}</span>
                          {opts ? (
                            <select className="input" value={value} aria-label={label} onChange={(e) => set(key, e.target.value as never)}>
                              <option value="">—</option>
                              {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          ) : (
                            <input className="input" type={kind === 'date' ? 'date' : 'text'} value={value} aria-label={label}
                              dir={key === 'fullNameArabic' ? 'rtl' : undefined} onChange={(e) => set(key, e.target.value as never)} />
                          )}
                          <span className={clsx('w-20 rounded-full px-2 py-0.5 text-center text-xs font-medium', BADGE[status])}>{BADGE_TEXT[status]}</span>
                        </div>
                        {reason && <p className="mt-1 text-xs text-amber-800">{reason}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <span className="text-xs text-slate-500">Anything still missing can be filled in on the next screen.</span>
            <Button variant="secondary" onClick={() => navigate('/employees/new')}>Cancel</Button>
            <Button onClick={continueToForm}>Continue to Add employee</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
