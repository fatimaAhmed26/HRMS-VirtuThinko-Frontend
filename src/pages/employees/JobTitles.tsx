import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as orgApi from '../../api/organization';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';
import type { JobTitle } from '../../types';
import { Field, TextInput } from './onboarding/fields';

const CURRENCY = { BH: 'BHD', SA: 'SAR' } as const;
const COUNTRY = { BH: 'Bahrain', SA: 'KSA' } as const;
const money = (v: string | null | undefined, country: 'BH' | 'SA') =>
  v == null ? <span className="text-slate-400">—</span> : `${Number(v).toFixed(country === 'BH' ? 3 : 2)} ${CURRENCY[country]}`;

function TitleDialog({ departmentId, title, canBands, onClose }: {
  departmentId: number; title: JobTitle | null; canBands: boolean; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(title?.name ?? '');
  const [grade, setGrade] = useState(title?.grade ?? '');
  const [country, setCountry] = useState<'BH' | 'SA'>(title?.country ?? 'BH');
  const [minSalary, setMinSalary] = useState(title?.minSalary ?? '');
  const [maxSalary, setMaxSalary] = useState(title?.maxSalary ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nameError = submitted && !name.trim() ? 'Enter a job title' : undefined;
  const range = Number(minSalary) > 0 && Number(maxSalary) > 0 && Number(maxSalary) < Number(minSalary);
  const salaryError = range ? 'Maximum must be at least the minimum' : undefined;

  const refresh = () => qc.invalidateQueries({ queryKey: ['job-titles', departmentId] });
  const save = useMutation({
    mutationFn: () => {
      // users without payroll access don't send salary fields, so existing bands are left as they are
      const body = {
        name: name.trim(),
        grade: grade.trim() || null,
        country,
        ...(canBands && { minSalary: minSalary === '' ? null : Number(minSalary), maxSalary: maxSalary === '' ? null : Number(maxSalary) }),
      };
      return title ? orgApi.updateJobTitle(title.id, body) : orgApi.createJobTitle(departmentId, body);
    },
    onSuccess: () => { refresh(); onClose(); },
  });
  const remove = useMutation({
    mutationFn: () => orgApi.deleteJobTitle(title!.id),
    onSuccess: () => { refresh(); onClose(); },
  });

  return (
    <Modal title={title ? 'Edit job title' : 'Add job title'} open onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (name.trim() && !salaryError) save.mutate();
        }}
      >
        <Field label="Job title" required error={nameError}>
          <TextInput value={name} onChange={setName} invalid={!!nameError} maxLength={100} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grade"><TextInput value={grade} onChange={setGrade} maxLength={20} /></Field>
          <Field label="Country">
            <select className="input" value={country} onChange={(e) => setCountry(e.target.value as 'BH' | 'SA')}>
              <option value="BH">Bahrain (BHD)</option>
              <option value="SA">KSA (SAR)</option>
            </select>
          </Field>
        </div>
        {canBands && (
          <div className="grid grid-cols-2 gap-4">
            <Field label={`Minimum salary (${CURRENCY[country]})`} error={salaryError}>
              <TextInput value={minSalary} onChange={setMinSalary} type="number" min="0" step={country === 'BH' ? '0.001' : '0.01'} invalid={!!salaryError} />
            </Field>
            <Field label={`Maximum salary (${CURRENCY[country]})`}>
              <TextInput value={maxSalary} onChange={setMaxSalary} type="number" min="0" step={country === 'BH' ? '0.001' : '0.01'} invalid={!!salaryError} />
            </Field>
          </div>
        )}
        <ErrorMessage error={save.error || remove.error} />
        <div className="flex items-center justify-between gap-2">
          {title ? (
            <Button type="button" variant="danger" loading={remove.isPending} onClick={() => (confirmDelete ? remove.mutate() : setConfirmDelete(true))}>
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function JobTitles() {
  const { id } = useParams();
  const departmentId = Number(id);
  const { can } = useAuth();
  const canManage = can(P.departmentManage);
  const canBands = can(P.payrollView);
  const [editing, setEditing] = useState<JobTitle | 'new' | null>(null);
  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });
  const dept = departments.data?.find((d) => d.id === departmentId);
  const titles = useQuery({
    queryKey: ['job-titles', departmentId],
    queryFn: () => orgApi.jobTitles(departmentId),
    enabled: Number.isInteger(departmentId),
  });
  const rows = titles.data ?? [];

  return (
    <>
      <Link to="/departments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Departments
      </Link>
      <PageHeader
        title={dept ? `${dept.name}: job titles` : 'Job titles'}
        subtitle={canBands ? 'Titles, grades and salary bands for this department' : 'Titles and grades for this department'}
        actions={canManage && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add job title</Button>}
      />

      <Card>
        <ErrorMessage error={titles.error || departments.error} />
        {titles.isLoading && <Loading />}
        {!titles.isLoading && !titles.error && rows.length === 0 && <EmptyState title="No job titles yet" />}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Job title</th>
                  <th className="font-medium">Grade</th>
                  <th className="font-medium">Country</th>
                  {canBands && <th className="font-medium">Minimum</th>}
                  {canBands && <th className="font-medium">Maximum</th>}
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 font-medium text-slate-900">{t.name}</td>
                    <td>{t.grade || <span className="text-slate-400">—</span>}</td>
                    <td>{COUNTRY[t.country]}</td>
                    {canBands && <td>{money(t.minSalary, t.country)}</td>}
                    {canBands && <td>{money(t.maxSalary, t.country)}</td>}
                    <td className="text-right">
                      {canManage && <Button variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /> Edit</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <TitleDialog departmentId={departmentId} title={editing === 'new' ? null : editing} canBands={canBands} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
