// Edit employee: the onboarding form, filled with the saved record. Salary changes go through Contracts.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { errorMessage } from '../../lib/api';
import type { Employee } from '../../types';
import { EmploymentSection } from './onboarding/EmploymentSection';
import { EntitySection } from './onboarding/EntitySection';
import { ChecklistSection, DeclarationSection, HrOnlySection, MedicalSection, SalarySection } from './onboarding/FinalSections';
import { CHECKLIST, SECTION_OF, toPayload, validate, type ChecklistKey, type OnboardingForm } from './onboarding/formState';
import { fromEmployee } from './onboarding/fromEmployee';
import { ContactSection, EmergencySection, IdSection, PersonalSection } from './onboarding/PersonalSections';
import { DependantsSection, PreviousEmploymentSection, QualificationsSection } from './onboarding/RepeatingSections';

const CHIPS = [
  ['entity', 'Entity'], ['employment', '1 Employment'], ['personal', '2 Personal'], ['id', '3 ID & residence'],
  ['contact', '4 Contact'], ['emergency', '5 Emergency'], ['dependants', '6 Dependants'], ['qualifications', '7 Qualifications'],
  ['previous', '8 Previous employment'], ['medical', '9 Medical'], ['salary', '10 Bank details'], ['documents', '11 Documents'],
  ['declaration', '12 Declaration'],
] as const;

function EditForm({ emp }: { emp: Employee }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [f, setForm] = useState<OnboardingForm>(() => fromEmployee(emp));
  const [files, setFiles] = useState<Partial<Record<ChecklistKey, File>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });
  const clients = useQuery({ queryKey: ['clients'], queryFn: orgApi.clients });
  const managers = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const errors = submitted ? validate(f, { needSalary: false }) : {};
  const badSections = new Set(Object.keys(errors).map((k) => SECTION_OF[k]));
  const props = { f, set, errors };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  function onFile(key: ChecklistKey, file: File | null) {
    if (file && file.size > 5 * 1024 * 1024) return setFileError(`"${file.name}" is larger than 5 MB`);
    if (file && !/\.(pdf|jpe?g|png)$/i.test(file.name)) return setFileError(`"${file.name}" must be a PDF, JPEG or PNG`);
    setFileError(null);
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file; else delete next[key];
      return next;
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      const checklist = { ...f.checklist };
      for (const key of Object.keys(files) as ChecklistKey[]) checklist[key] = { na: false, received: true };
      const payload: Record<string, unknown> = { ...toPayload(f), documentChecklist: checklist };
      if (f.bankAccountNumber.includes('•')) delete payload.bankAccountNumber; // masked: leave the saved IBAN as it is
      await employeesApi.update(emp.id, payload as Partial<Employee>);

      const failed: string[] = [];
      const expiry: Partial<Record<ChecklistKey, string>> = { passport: f.passportExpiry, nationalId: f.idExpiry, permit: f.permitExpiry };
      for (const item of CHECKLIST) {
        const file = files[item.key];
        if (!file) continue;
        try {
          await documentsApi.upload({ file, employeeId: emp.id, category: item.category, title: item.label, expiryDate: expiry[item.key] || undefined });
        } catch (err) {
          failed.push(`${item.label}: ${errorMessage(err)}`);
        }
      }
      return failed;
    },
    onSuccess: (failed) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
      if (failed.length) setProblems(failed);
      else navigate(`/employees/${emp.id}`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(f, { needSalary: false });
    const first = CHIPS.find(([id]) => Object.keys(found).some((k) => SECTION_OF[k] === id));
    if (first) return scrollTo(first[0]);
    save.mutate();
  }

  if (problems.length) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-slate-900">Changes saved, but some files did not upload</h1>
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        <Button onClick={() => navigate(`/employees/${emp.id}?tab=documents`)}>Open documents</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl space-y-5 pb-10">
      <div>
        <p className="text-xs text-slate-500">
          <Link to="/employees" className="hover:underline">All employees</Link> / <Link to={`/employees/${emp.id}`} className="hover:underline">{emp.firstName} {emp.lastName}</Link> / Edit
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Edit {emp.firstName} {emp.lastName}</h1>
        <p className="mt-1 text-sm text-slate-500">{emp.employeeCode} · Every change is recorded in the profile's history. Salary changes are made in Contracts.</p>
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

      {(departments.isLoading || clients.isLoading || managers.isLoading) && <Loading />}
      <ErrorMessage error={departments.error || clients.error || managers.error} />

      <EntitySection {...props} clients={clients.data ?? []} />
      <EmploymentSection {...props} departments={departments.data ?? []}
        managers={(managers.data?.items ?? []).filter((m) => m.id !== emp.id)}
        photo={files.photo ?? null} onPhoto={(file) => onFile('photo', file)} />
      <PersonalSection {...props} />
      <IdSection {...props} />
      <ContactSection {...props} />
      <EmergencySection {...props} />
      <DependantsSection {...props} />
      <QualificationsSection {...props} />
      <PreviousEmploymentSection {...props} />
      <MedicalSection {...props} />
      <SalarySection {...props} showSalary={false} />
      <ChecklistSection {...props} files={files} onFile={onFile} />
      <DeclarationSection {...props} />
      <HrOnlySection {...props} verifierName={user?.username ?? ''} />

      <ErrorMessage error={fileError} />
      {submitted && Object.keys(errors).length > 0 && (
        <ErrorMessage error={`Please fix the ${Object.keys(errors).length} highlighted field${Object.keys(errors).length === 1 ? '' : 's'} (sections marked in red above).`} />
      )}
      <ErrorMessage error={save.error} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate(`/employees/${emp.id}`)}>Cancel</Button>
        <Button type="submit" loading={save.isPending}>Save changes</Button>
      </div>
    </form>
  );
}

export default function EditEmployee() {
  const id = Number(useParams().id);
  const employee = useQuery({ queryKey: ['employees', id], queryFn: () => employeesApi.get(id), enabled: Number.isInteger(id) && id > 0 });
  if (employee.isLoading) return <Loading />;
  if (employee.error || !employee.data) return <div className="mx-auto max-w-5xl"><ErrorMessage error={employee.error ?? 'Employee not found'} /></div>;
  // key: a fresh form if the record is reloaded for another employee
  return <EditForm key={employee.data.id} emp={employee.data} />;
}
