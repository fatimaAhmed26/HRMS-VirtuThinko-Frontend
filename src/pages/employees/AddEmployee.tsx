// Add employee: the full onboarding form VTHR-ONB-F01 (design screen 13, pages 18-25)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as contractsApi from '../../api/contracts';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { errorMessage } from '../../lib/api';
import { P } from '../../lib/permissions';
import type { Employee } from '../../types';
import { EmploymentSection } from './onboarding/EmploymentSection';
import { EntitySection } from './onboarding/EntitySection';
import { ChecklistSection, DeclarationSection, HrOnlySection, MedicalSection, SalarySection } from './onboarding/FinalSections';
import type { ImportResult } from './import/fromImport';
import { ContactSection, EmergencySection, IdSection, PersonalSection } from './onboarding/PersonalSections';
import { DependantsSection, PreviousEmploymentSection, QualificationsSection } from './onboarding/RepeatingSections';
import {
  CHECKLIST, SECTION_OF, clearDraft, initialForm, loadDraft, saveDraft, toPayload, validate,
  type ChecklistKey, type OnboardingForm,
} from './onboarding/formState';

const CHIPS = [
  ['entity', 'Entity'], ['employment', '1 Employment'], ['personal', '2 Personal'], ['id', '3 ID & residence'],
  ['contact', '4 Contact'], ['emergency', '5 Emergency'], ['dependants', '6 Dependants'], ['qualifications', '7 Qualifications'],
  ['previous', '8 Previous employment'], ['medical', '9 Medical'], ['salary', '10 Salary payment'], ['documents', '11 Documents'],
  ['declaration', '12 Declaration'],
] as const;

const MAX_FILE = 5 * 1024 * 1024;

// the employee was saved but a later step failed: show what is left to do instead of saving twice
interface Saved { employee: Employee; problems: string[] }

export default function AddEmployee() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, can } = useAuth();
  const canContract = can(P.contractManage);

  // arriving from "Import completed form": start from what was read; otherwise from a saved draft
  const imported = (useLocation().state as { imported?: ImportResult } | null)?.imported ?? null;
  const [draftRestored] = useState(() => !imported && loadDraft() !== null);
  const [f, setForm] = useState<OnboardingForm>(() => imported?.form ?? loadDraft() ?? initialForm());
  const [files, setFiles] = useState<Partial<Record<ChecklistKey, File>>>(() => imported?.files ?? {});
  const [submitted, setSubmitted] = useState(() => imported !== null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });
  const clients = useQuery({ queryKey: ['clients'], queryFn: orgApi.clients });
  const managers = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  // errors appear after the first "Add employee" click and update as fields are fixed
  const errors = submitted ? validate(f, { needSalary: canContract }) : {};
  const badSections = new Set(Object.keys(errors).map((k) => SECTION_OF[k]));
  const props = { f, set, errors };

  function onFile(key: ChecklistKey, file: File | null) {
    if (file && file.size > MAX_FILE) return setFileError(`"${file.name}" is larger than 5 MB`);
    if (file && !/\.(pdf|jpe?g|png)$/i.test(file.name)) return setFileError(`"${file.name}" must be a PDF, JPEG or PNG`);
    setFileError(null);
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file; else delete next[key];
      return next;
    });
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const save = useMutation({
    mutationFn: async () => {
      // an uploaded file counts as received by HR
      const checklist = { ...f.checklist };
      for (const key of Object.keys(files) as ChecklistKey[]) checklist[key] = { na: false, received: true };
      const employee = await employeesApi.create({ ...toPayload(f), documentChecklist: checklist });

      const problems: string[] = [];
      if (canContract && f.monthlySalary) {
        const fixedTerm = f.team !== 'OUT' && f.employmentType === 'Fixed-term';
        try {
          await contractsApi.create({
            employeeId: employee.id,
            contractType: fixedTerm ? 'limited' : 'unlimited',
            jobTitle: f.jobTitle.trim(),
            startDate: f.hireDate,
            endDate: fixedTerm ? f.contractEnd : undefined,
            basicSalary: Number(f.monthlySalary),
          });
        } catch (err) {
          problems.push(`Contract and salary were not saved: ${errorMessage(err)}`);
        }
      }

      // expiry dates make the documents show up in the expiry reminders
      const expiry: Partial<Record<ChecklistKey, string>> = { passport: f.passportExpiry, nationalId: f.idExpiry, permit: f.permitExpiry };
      for (const item of CHECKLIST) {
        const file = files[item.key];
        if (!file) continue;
        try {
          await documentsApi.upload({ file, employeeId: employee.id, category: item.category, title: item.label, expiryDate: expiry[item.key] || undefined });
        } catch (err) {
          problems.push(`${item.label}: ${errorMessage(err)}`);
        }
      }
      return { employee, problems };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      clearDraft();
      if (result.problems.length) {
        setSaved(result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(`/employees/${result.employee.id}?created=1`);
      }
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setNotice(null);
    const found = validate(f, { needSalary: canContract });
    const first = CHIPS.find(([id]) => Object.keys(found).some((k) => SECTION_OF[k] === id));
    if (first) return scrollTo(first[0]);
    save.mutate();
  }

  function onDraft() {
    setNotice(saveDraft(f)
      ? 'Draft saved in this browser. Medical details, IBAN, salary and files are not kept in drafts.'
      : 'This browser blocked saving the draft.');
  }

  function discardDraft() {
    clearDraft();
    setForm(initialForm());
    setFiles({});
    setSubmitted(false);
    setNotice('Draft discarded.');
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-slate-900">
          {saved.employee.firstName} {saved.employee.lastName} was added as {saved.employee.employeeCode}
        </h1>
        <p className="text-sm text-slate-700">Some steps did not finish. Add them from the employee's profile:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">{saved.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/employees/${saved.employee.id}`)}>Open employee profile</Button>
          <Button variant="secondary" onClick={() => navigate('/employees')}>All employees</Button>
        </div>
      </div>
    );
  }

  const loading = departments.isLoading || clients.isLoading || managers.isLoading;
  const loadError = departments.error || clients.error || managers.error;

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl space-y-5 pb-10">
      <div>
        <p className="text-xs text-slate-500"><Link to="/employees" className="hover:underline">Employee management</Link> / Add employee</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Add employee</h1>
        <p className="mt-1 text-sm text-slate-500">
          New Employee Information Form · VTHR-ONB-F01. Enter details exactly as on official documents, in English. Use N/A where a field does not apply.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/employees/import')}>Import completed form</Button>
          <Button type="button" variant="secondary" disabled title="Coming soon">Send form to employee</Button>
        </div>
        <nav aria-label="Form sections" className="mt-4 flex flex-wrap gap-2">
          {CHIPS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => scrollTo(id)}
              className={clsx('rounded-full border px-3 py-1 text-xs font-medium transition',
                badSections.has(id) ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600')}>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {imported && !notice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Filled in from <b>{imported.fileName}</b>. Check the highlighted sections, add the work email if it was not on the form, then save.
        </div>
      )}
      {draftRestored && !notice && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          A saved draft was restored.
          <button type="button" className="font-medium underline" onClick={discardDraft}>Discard draft</button>
        </div>
      )}
      {notice && <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">{notice}</div>}
      {loading && <Loading />}
      <ErrorMessage error={loadError} />

      <EntitySection {...props} clients={clients.data ?? []} />
      <EmploymentSection {...props} departments={departments.data ?? []} managers={managers.data?.items ?? []}
        photo={files.photo ?? null} onPhoto={(file) => onFile('photo', file)} />
      <PersonalSection {...props} />
      <IdSection {...props} />
      <ContactSection {...props} />
      <EmergencySection {...props} />
      <DependantsSection {...props} />
      <QualificationsSection {...props} />
      <PreviousEmploymentSection {...props} />
      <MedicalSection {...props} />
      <SalarySection {...props} showSalary={canContract} />
      <ChecklistSection {...props} files={files} onFile={onFile} />
      <DeclarationSection {...props} />
      <HrOnlySection {...props} verifierName={user?.username ?? ''} />

      <ErrorMessage error={fileError} />
      {submitted && Object.keys(errors).length > 0 && (
        <ErrorMessage error={`Please fix the ${Object.keys(errors).length} highlighted field${Object.keys(errors).length === 1 ? '' : 's'} (sections marked in red above).`} />
      )}
      <ErrorMessage error={save.error} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>Cancel</Button>
        <Button type="button" variant="secondary" onClick={onDraft}>Save as draft</Button>
        <Button type="submit" loading={save.isPending}>Add employee &amp; start onboarding</Button>
      </div>
    </form>
  );
}
