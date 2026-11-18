// The onboarding form for a new joiner, opened from a link HR sent. No sign-in needed.
// HR adds the entity, department, line manager, work email, bank and salary details afterwards.
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import * as onboardingApi from '../../api/onboarding';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { EmploymentSection } from '../employees/onboarding/EmploymentSection';
import { ChecklistSection, DeclarationSection, MedicalSection } from '../employees/onboarding/FinalSections';
import { ContactSection, EmergencySection, IdSection, PersonalSection } from '../employees/onboarding/PersonalSections';
import { DependantsSection, PreviousEmploymentSection, QualificationsSection } from '../employees/onboarding/RepeatingSections';
import { SECTION_OF, initialForm, validate, type ChecklistKey, type Errors, type OnboardingForm } from '../employees/onboarding/formState';

const MAX_FILE = 5 * 1024 * 1024;

// Filled in by HR, so this form neither asks for them nor sends them
const HR_FIELDS = new Set([
  'team', 'clientCompanyId', 'employedBy', 'clientSite', 'poNumber', 'deploymentStart', 'deploymentEnd', 'clientSupervisor',
  'departmentId', 'managerId', 'email', 'bankName', 'bankBranch', 'bankAccountHolder', 'bankAccountNumber', 'monthlySalary',
  'verifiedAt', 'hrRemarks',
]);

const employeeErrors = (f: OnboardingForm): Errors =>
  Object.fromEntries(Object.entries(validate(f, { needSalary: false })).filter(([k]) => !HR_FIELDS.has(k)));

const answersOf = (f: OnboardingForm) => Object.fromEntries(Object.entries(f).filter(([k]) => !HR_FIELDS.has(k)));

const CLOSED: Record<string, string> = {
  expired: 'This link has expired. Ask HR for a new link.',
  submitted: 'This form was already submitted. Thank you.',
  cancelled: 'HR cancelled this form. Ask HR for a new link if you still need to fill it in.',
};

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-lg space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}

export default function EmployeeForm() {
  const token = useParams().token ?? '';
  const info = useQuery({ queryKey: ['onboarding-public', token], queryFn: () => onboardingApi.publicInfo(token), retry: false });

  const [f, setForm] = useState<OnboardingForm>(() => initialForm());
  const [files, setFiles] = useState<Partial<Record<ChecklistKey, File>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const errors = submitted ? employeeErrors(f) : {};
  const props = { f, set, errors };

  const send = useMutation({
    mutationFn: () => onboardingApi.submit(token, answersOf(f), files),
    onSuccess: () => setDone(true),
  });

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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const found = employeeErrors(f);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found).map((k) => SECTION_OF[k]).find(Boolean);
      document.getElementById(first ?? 'top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    send.mutate();
  }

  if (info.isLoading) return <Loading />;
  if (info.error || !info.data) return <Notice title="This link is not valid">Ask HR for a new link.</Notice>;
  if (done) return <Notice title="Thank you">Your details were sent to HR. They will check them and contact you about the next steps.</Notice>;
  if (info.data.status !== 'sent') {
    return <Notice title="Form closed">{CLOSED[info.data.status] ?? CLOSED.cancelled}</Notice>;
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div id="top" className="min-h-screen bg-slate-50 px-4 py-8">
      <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl space-y-5 pb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">VirtuThinko</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">New joiner information form</h1>
          <p className="mt-1 text-sm text-slate-500">
            Form VTHR-ONB-F01. Enter your details exactly as on your official documents, in English. Use N/A where a field does not apply.
            HR completes the rest.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Link valid until {fmtDate(info.data.expiresAt)}. Your answers are sent only when you press Submit, so keep this page open until then.
          </p>
        </div>

        <EmploymentSection {...props} departments={[]} managers={[]} employeeMode photo={files.photo ?? null} onPhoto={(file) => onFile('photo', file)} />
        <PersonalSection {...props} />
        <IdSection {...props} />
        <ContactSection {...props} />
        <EmergencySection {...props} />
        <DependantsSection {...props} />
        <QualificationsSection {...props} />
        <PreviousEmploymentSection {...props} />
        <MedicalSection {...props} />
        <ChecklistSection {...props} files={files} onFile={onFile} employeeMode />
        <DeclarationSection {...props} />

        <ErrorMessage error={fileError} />
        {submitted && errorCount > 0 && (
          <ErrorMessage error={`Please fix the ${errorCount} highlighted field${errorCount === 1 ? '' : 's'}.`} />
        )}
        <ErrorMessage error={send.error} />
        <div className="flex justify-end">
          <Button type="submit" loading={send.isPending}>Submit form</Button>
        </div>
      </form>
    </div>
  );
}
