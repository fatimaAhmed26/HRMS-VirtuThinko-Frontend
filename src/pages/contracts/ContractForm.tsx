// New employment contract (English only): details, salary package and a summary; saved as a contract, then sent for signature from its page
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import * as contractsApi from '../../api/contracts';
import * as employeesApi from '../../api/employees';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { fmtMoney } from '../../lib/format';
import type { SalaryItem } from '../../types';
import { Field, TextInput } from '../employees/onboarding/fields';
import { packageTotals } from './packageMath';

const DEFAULT_TITLE: Record<'unlimited' | 'limited', string> = { unlimited: 'Unlimited Employment Contract', limited: 'Limited Employment Contract' };
const PROBATION = [['0', 'No probation'], ['1', '1 month'], ['2', '2 months'], ['3', '3 months'], ['6', '6 months']] as const;
const NOTICE = [['15', '15 days'], ['30', '30 days'], ['60', '60 days'], ['90', '90 days']] as const;

interface Component { id: number; kind: SalaryItem['kind']; label: string; amount: string; paid: SalaryItem['paid'] }

const num = (v: string) => Number(v) || 0;

export default function ContractForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const employees = useQuery({ queryKey: ['employees-active'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const [f, setF] = useState({
    employeeId: '', contractType: 'unlimited' as 'unlimited' | 'limited', title: DEFAULT_TITLE.unlimited, employingEntity: '', jobTitle: '',
    startDate: '', endDate: '', weeklyHours: '40', probationMonths: '3', noticeDays: '30', annualLeaveDays: '30',
    basic: '', housing: '', transport: '', notes: '',
  });
  const [components, setComponents] = useState<Component[]>([]);
  const [localError, setLocalError] = useState('');
  const nextId = useRef(1);

  const set = (key: keyof typeof f, value: string) => setF((s) => ({ ...s, [key]: value }));

  // the English title follows the contract type until HR types their own title
  const setType = (t: 'unlimited' | 'limited') =>
    setF((s) => ({
      ...s,
      contractType: t,
      title: s.title === DEFAULT_TITLE[s.contractType] ? DEFAULT_TITLE[t] : s.title,
      endDate: t === 'unlimited' ? '' : s.endDate,
    }));

  const addComponent = (kind: SalaryItem['kind']) =>
    setComponents((rows) => [...rows, { id: nextId.current++, kind, label: '', amount: '', paid: kind === 'bonus' ? 'yearly' : 'monthly' }]);
  const updateComponent = (id: number, patch: Partial<Component>) =>
    setComponents((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch, paid: patch.kind === 'bonus' ? 'yearly' : (patch.paid ?? r.paid) } : r)));
  const removeComponent = (id: number) => setComponents((rows) => rows.filter((r) => r.id !== id));

  const items: SalaryItem[] = components.map((c) => ({ kind: c.kind, label: c.label.trim(), amount: num(c.amount), paid: c.paid }));
  const totals = packageTotals({ basic: num(f.basic), housing: num(f.housing), transport: num(f.transport), items });

  const save = useMutation({
    mutationFn: () => {
      const payload: contractsApi.ContractInput = {
        employeeId: Number(f.employeeId),
        contractType: f.contractType,
        title: f.title.trim() || undefined,
        employingEntity: f.employingEntity.trim() || undefined,
        jobTitle: f.jobTitle.trim() || undefined,
        startDate: f.startDate,
        endDate: f.contractType === 'limited' ? f.endDate : undefined,
        basicSalary: num(f.basic),
        housingAllowance: num(f.housing),
        transportAllowance: num(f.transport),
        weeklyHours: Number(f.weeklyHours) || undefined,
        probationMonths: Number(f.probationMonths),
        noticeDays: Number(f.noticeDays),
        annualLeaveDays: Number(f.annualLeaveDays),
        items,
        notes: f.notes.trim() || undefined,
      };
      return contractsApi.create(payload);
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      navigate(`/contracts/${c.id}`);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!f.employeeId) return setLocalError('Choose the employee');
    if (!f.startDate) return setLocalError('Enter the start date');
    if (f.contractType === 'limited' && !f.endDate) return setLocalError('A limited contract needs an end date');
    if (num(f.basic) <= 0) return setLocalError('Enter the basic salary');
    if (components.some((c) => !c.label.trim() || num(c.amount) <= 0)) return setLocalError('Each salary component needs a name and an amount');
    save.mutate();
  };

  const inputMoney = (value: string, onChange: (v: string) => void) => (
    <TextInput type="number" step="0.001" min="0" value={value} onChange={onChange} className="text-right" />
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader title="New contract" subtitle="English contract. It is sent to the employee for signature from the contract page." />

      <Card title="Contract details">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Employee" required>
            <select className="input" value={f.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
              <option value="">Choose an employee</option>
              {employees.data?.items.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </Field>
          <Field label="Contract name (English)" required>
            <TextInput value={f.title} onChange={(v) => set('title', v)} maxLength={150} />
          </Field>
          <Field label="Contract type" required>
            <select className="input" value={f.contractType} onChange={(e) => setType(e.target.value as 'unlimited' | 'limited')}>
              <option value="unlimited">Unlimited (indefinite)</option>
              <option value="limited">Limited (fixed term)</option>
            </select>
          </Field>
          <Field label="Employing entity" hint="Leave empty to use the company name in Settings">
            <TextInput value={f.employingEntity} onChange={(v) => set('employingEntity', v)} maxLength={100} />
          </Field>
          <Field label="Job title">
            <TextInput value={f.jobTitle} onChange={(v) => set('jobTitle', v)} maxLength={100} />
          </Field>
          <Field label="Working hours / week">
            <TextInput type="number" min="1" max="60" value={f.weeklyHours} onChange={(v) => set('weeklyHours', v)} />
          </Field>
          <Field label="Start date" required>
            <TextInput type="date" value={f.startDate} onChange={(v) => set('startDate', v)} />
          </Field>
          <Field label="End date" hint={f.contractType === 'unlimited' ? 'Open-ended' : undefined} required={f.contractType === 'limited'}>
            <TextInput type="date" value={f.endDate} disabled={f.contractType === 'unlimited'} onChange={(v) => set('endDate', v)} />
          </Field>
          <Field label="Probation period">
            <select className="input" value={f.probationMonths} onChange={(e) => set('probationMonths', e.target.value)}>
              {PROBATION.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Notice period">
            <select className="input" value={f.noticeDays} onChange={(e) => set('noticeDays', e.target.value)}>
              {NOTICE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Annual leave (days)">
            <TextInput type="number" min="0" max="60" value={f.annualLeaveDays} onChange={(v) => set('annualLeaveDays', v)} />
          </Field>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Salary package (monthly, BHD)">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-2 py-2 font-medium">Component</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Paid</th>
                    <th className="px-2 py-2 text-right font-medium">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-2 py-2">Basic salary</td><td className="px-2 py-2">Earning</td><td className="px-2 py-2">Monthly</td>
                    <td className="w-40 px-2 py-1">{inputMoney(f.basic, (v) => set('basic', v))}</td><td />
                  </tr>
                  <tr>
                    <td className="px-2 py-2">Housing allowance</td><td className="px-2 py-2">Allowance</td><td className="px-2 py-2">Monthly</td>
                    <td className="px-2 py-1">{inputMoney(f.housing, (v) => set('housing', v))}</td><td />
                  </tr>
                  <tr>
                    <td className="px-2 py-2">Transport allowance</td><td className="px-2 py-2">Allowance</td><td className="px-2 py-2">Monthly</td>
                    <td className="px-2 py-1">{inputMoney(f.transport, (v) => set('transport', v))}</td><td />
                  </tr>
                  {components.map((c) => (
                    <tr key={c.id}>
                      <td className="px-2 py-1">
                        <TextInput value={c.label} placeholder="Name" maxLength={80} onChange={(v) => updateComponent(c.id, { label: v })} />
                      </td>
                      <td className="px-2 py-1">
                        <select className="input" value={c.kind} onChange={(e) => updateComponent(c.id, { kind: e.target.value as SalaryItem['kind'] })}>
                          <option value="allowance">Allowance</option>
                          <option value="deduction">Deduction</option>
                          <option value="bonus">Bonus</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select className="input" value={c.paid} disabled={c.kind === 'bonus'} onChange={(e) => updateComponent(c.id, { paid: e.target.value as SalaryItem['paid'] })}>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </td>
                      <td className="w-40 px-2 py-1">{inputMoney(c.amount, (v) => updateComponent(c.id, { amount: v }))}</td>
                      <td className="px-2 py-1">
                        <button type="button" className="text-slate-400 hover:text-red-600" aria-label="Remove component" onClick={() => removeComponent(c.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="text-slate-500">
                    <td className="px-2 py-2">Social insurance (SIO), employee share</td><td className="px-2 py-2">Deduction</td><td className="px-2 py-2">Monthly</td>
                    <td className="px-2 py-2 text-right">Auto (by payroll rules)</td><td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => addComponent('allowance')}>+ Allowance</Button>
              <Button type="button" variant="secondary" onClick={() => addComponent('deduction')}>+ Deduction</Button>
              <Button type="button" variant="secondary" onClick={() => addComponent('bonus')}>+ Bonus</Button>
            </div>
          </Card>
        </div>

        <Card title="Summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Gross salary</dt><dd>{fmtMoney(totals.gross)}</dd></div>
            <div className="flex justify-between"><dt>Monthly deductions</dt><dd>{fmtMoney(totals.deductions)} + SIO</dd></div>
            <div className="flex justify-between font-semibold"><dt>Net monthly pay</dt><dd>{fmtMoney(totals.net)} *</dd></div>
            <div className="flex justify-between"><dt>Yearly bonuses</dt><dd>{fmtMoney(totals.yearlyBonus)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold"><dt>Total annual package</dt><dd>{fmtMoney(totals.totalAnnual)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">* Before social insurance, which payroll calculates.</p>
        </Card>
      </div>

      <Card title="Notes">
        <textarea className="input min-h-20" maxLength={500} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
      </Card>

      {localError && <p className="text-sm text-red-600">{localError}</p>}
      {save.error && <ErrorMessage error={save.error} />}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate('/contracts')}>Cancel</Button>
        <Button type="submit" loading={save.isPending}>Create contract</Button>
      </div>
    </form>
  );
}
