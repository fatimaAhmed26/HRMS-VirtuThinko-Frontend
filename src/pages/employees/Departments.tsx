import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { P } from '../../lib/permissions';
import type { Department } from '../../types';
import { Field, TextInput } from './onboarding/fields';

function DepartmentDialog({ dept, onClose }: { dept: Department | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(dept?.name ?? '');
  const [managerId, setManagerId] = useState(dept?.managerId ? String(dept.managerId) : '');
  const [location, setLocation] = useState(dept?.location ?? '');
  const [submitted, setSubmitted] = useState(false);
  const heads = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), managerId: managerId ? Number(managerId) : null, location: location.trim() || null };
      return dept ? orgApi.updateDepartment(dept.id, body) : orgApi.createDepartment(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      onClose();
    },
  });

  const nameError = submitted && !name.trim() ? 'Enter a department name' : undefined;

  return (
    <Modal title={dept ? 'Edit department' : 'Add department'} open onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (name.trim()) save.mutate();
        }}
      >
        <Field label="Name" required error={nameError}>
          <TextInput value={name} onChange={setName} invalid={!!nameError} maxLength={100} />
        </Field>
        <Field label="Head">
          <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">Not set</option>
            {(heads.data?.items ?? []).filter((m) => m.employmentType !== 'Intern').map((m) => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
        </Field>
        <Field label="Location" hint="Office or site">
          <TextInput value={location} onChange={setLocation} maxLength={100} />
        </Field>
        <ErrorMessage error={heads.error || save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Departments() {
  const { can } = useAuth();
  const canManage = can(P.departmentManage);
  const [editing, setEditing] = useState<Department | 'new' | null>(null);
  const { data = [], isLoading, error } = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Each department's head, headcount (active employees) and location"
        actions={canManage && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add department</Button>}
      />

      <Card>
        <ErrorMessage error={error} />
        {isLoading && <Loading />}
        {!isLoading && !error && data.length === 0 && <EmptyState title="No departments yet" />}
        {data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Department</th>
                  <th className="font-medium">Head</th>
                  <th className="font-medium">Headcount</th>
                  <th className="font-medium">Location</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 font-medium text-slate-900">{d.name}</td>
                    <td>{d.manager ? `${d.manager.firstName} ${d.manager.lastName}` : <span className="text-slate-400">Not set</span>}</td>
                    <td>{d._count?.employees ?? 0}</td>
                    <td>{d.location || <span className="text-slate-400">Not set</span>}</td>
                    <td className="text-right">
                      <Link to={`/departments/${d.id}/job-titles`}><Button variant="ghost">Job titles</Button></Link>
                      {canManage && (
                        <Button variant="ghost" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /> Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && <DepartmentDialog dept={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
