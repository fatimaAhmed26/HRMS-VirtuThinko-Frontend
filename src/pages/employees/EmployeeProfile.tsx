// Employee profile (design screens 3-12): header with the main actions, and one tab per part of the record.
// Each tab only shows for people allowed to see it (salary for payroll, medical for HR who can edit, ...).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Initials } from '../../components/ui/Initials';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';
import type { Employee } from '../../types';
import { DocumentsTab } from './profile/DocumentsTab';
import { EmergencyTab } from './profile/EmergencyTab';
import { HistoryTab } from './profile/HistoryTab';
import { JobTab } from './profile/JobTab';
import { LeaveTab } from './profile/LeaveTab';
import { LettersTab } from './profile/LettersTab';
import { PersonalTab } from './profile/PersonalTab';
import { SalaryTab } from './profile/SalaryTab';

const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'job', label: 'Job & contract' },
  { id: 'salary', label: 'Salary & payslips', perms: [P.payrollView] },
  { id: 'leave', label: 'Leave' },
  { id: 'documents', label: 'Documents', perms: [P.documentView] },
  { id: 'letters', label: 'Letters & certificates', perms: [P.requestView, P.requestProcess] },
  { id: 'emergency', label: 'Emergency & dependants' },
  { id: 'history', label: 'History' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function StatusDialog({ emp, open, onClose }: { emp: Employee; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const deactivating = emp.status === 'active';
  const change = useMutation({
    mutationFn: () => employeesApi.setStatus(emp.id, deactivating ? 'inactive' : 'active', reason.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setReason('');
      onClose();
    },
  });
  function submit(e: FormEvent) { e.preventDefault(); change.mutate(); }

  return (
    <Modal title={`${deactivating ? 'Deactivate' : 'Reactivate'} ${emp.firstName} ${emp.lastName}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-600">
          {deactivating
            ? 'They will no longer be able to sign in, and they drop out of payroll runs and team lists. Their record and documents are kept.'
            : 'They will appear in lists and payroll again. Their portal login stays as it was.'}
        </p>
        {deactivating && (
          <label className="block"><span className="label">Reason</span>
            <input className="input" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Resigned, last working day 30 Nov 2026" />
          </label>
        )}
        <ErrorMessage error={change.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={change.isPending}>{deactivating ? 'Deactivate' : 'Reactivate'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeeProfile() {
  const id = Number(useParams().id);
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const [statusOpen, setStatusOpen] = useState(false);
  const [letterHint, setLetterHint] = useState(false);

  const employee = useQuery({ queryKey: ['employees', id], queryFn: () => employeesApi.get(id), enabled: Number.isInteger(id) && id > 0 });
  const tabs = TABS.filter((t) => !('perms' in t) || t.perms.some((p) => can(p)));
  const asked = params.get('tab') as TabId | null;
  const tab: TabId = tabs.some((t) => t.id === asked) ? asked! : 'personal';
  const created = params.get('created') === '1';

  function open(next: TabId) {
    const p = new URLSearchParams(params);
    p.set('tab', next);
    p.delete('created');
    setParams(p, { replace: true });
  }

  if (employee.isLoading) return <Loading />;
  if (employee.error || !employee.data) return <div className="mx-auto max-w-5xl"><ErrorMessage error={employee.error ?? 'Employee not found'} /></div>;
  const emp = employee.data;
  const outsourced = emp.employmentType === 'Outsourced';

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <p className="text-xs text-slate-500"><Link to="/employees" className="hover:underline">All employees</Link> / {emp.firstName} {emp.lastName}</p>

      {created && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {emp.firstName} {emp.lastName} was added as {emp.employeeCode}.
        </div>
      )}

      <header className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <Initials firstName={emp.firstName} lastName={emp.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-xl font-semibold text-slate-900">
            {emp.firstName} {emp.lastName}
            {emp.fullNameArabic && <span className="text-base font-normal text-slate-600" dir="rtl">{emp.fullNameArabic}</span>}
          </h1>
          <p className="text-sm text-slate-500">{[emp.jobTitle, emp.department?.name, emp.employeeCode].filter(Boolean).join(' · ')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{emp.country === 'SA' ? 'KSA' : 'Bahrain'}</span>
            {outsourced && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Outsourced · {emp.clientCompany?.name ?? 'client'}</span>}
            {emp.employmentType && !outsourced && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{emp.employmentType}</span>}
            <span className={clsx('rounded-full px-2 py-0.5', emp.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600')}>
              {emp.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can(P.employeeDeactivate) && (
            <Button variant="secondary" onClick={() => setStatusOpen(true)}>{emp.status === 'active' ? 'Deactivate' : 'Reactivate'}</Button>
          )}
          {can(P.employeeEdit) && <Link to={`/employees/${emp.id}/edit`}><Button variant="secondary">Edit</Button></Link>}
          {can(P.requestProcess) && <Button onClick={() => { setLetterHint(true); open('letters'); }}>Generate letter</Button>}
        </div>
      </header>

      <nav aria-label="Profile sections" className="flex flex-wrap gap-x-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => { setLetterHint(false); open(t.id); }}
            aria-current={tab === t.id ? 'page' : undefined}
            className={clsx('-mb-px border-b-2 px-3 py-2 text-sm font-medium transition',
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900')}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'personal' && <PersonalTab emp={emp} />}
      {tab === 'job' && <JobTab emp={emp} />}
      {tab === 'salary' && <SalaryTab emp={emp} />}
      {tab === 'leave' && <LeaveTab emp={emp} />}
      {tab === 'documents' && <DocumentsTab emp={emp} />}
      {tab === 'letters' && <LettersTab emp={emp} initialType={letterHint} />}
      {tab === 'emergency' && <EmergencyTab emp={emp} />}
      {tab === 'history' && <HistoryTab employeeId={emp.id} />}

      <StatusDialog emp={emp} open={statusOpen} onClose={() => setStatusOpen(false)} />
    </div>
  );
}
