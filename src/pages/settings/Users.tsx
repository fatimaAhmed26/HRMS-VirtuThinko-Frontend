import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as employeesApi from '../../api/employees';
import * as usersApi from '../../api/users';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDateTime, fullName } from '../../lib/format';

// Portal logins. A login linked to an employee record gets the employee view: leave, requests and documents.
// That includes HR staff, who need their own record to request leave.
export default function Users() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const canLink = can('user:manage');

  const { data, isLoading, error } = useQuery({ queryKey: ['users', 'list'], queryFn: () => usersApi.list({ pageSize: 100 }) });
  const { data: staffPage } = useQuery({
    queryKey: ['employees', 'link-options'],
    queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }),
    enabled: canLink,
  });

  const link = useMutation({
    mutationFn: ({ id, employeeId }: { id: number; employeeId: number | null }) => usersApi.linkEmployee(id, employeeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const users = data?.items ?? [];
  const linked = new Set(users.flatMap((u) => (u.employee ? [u.employee.id] : [])));
  const people = (staffPage?.items ?? []).filter((e) => e.employmentType !== 'Intern'); // interns get no portal login

  return (
    <>
      <PageHeader title="Users" subtitle="Portal logins and the employee record each one belongs to." />
      {!canLink && <p className="mb-4 text-sm text-slate-500">Only administrators who can manage users can change these links.</p>}

      <Card>
        {isLoading && <Loading />}
        <ErrorMessage error={error ?? link.error} />
        {!isLoading && !error && users.length === 0 && <EmptyState title="No portal logins yet" />}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Login</th>
                  <th className="py-2 pr-4 font-medium">Roles</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Employee record</th>
                  <th className="py-2 font-medium">Last sign-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const own = u.employee;
                  // an employee can only have one login, so hide the records that another login already uses
                  const choices = people.filter((e) => e.id === own?.id || !linked.has(e.id));
                  return (
                    <tr key={u.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900">{u.username}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{u.roles.map((r) => r.name).join(', ') || '-'}</td>
                      <td className="py-3 pr-4"><StatusBadge status={u.status} /></td>
                      <td className="py-3 pr-4">
                        <select
                          className="input max-w-xs"
                          aria-label={`Employee record for ${u.username}`}
                          value={own?.id ?? ''}
                          disabled={!canLink || link.isPending}
                          onChange={(e) => link.mutate({ id: u.id, employeeId: e.target.value ? Number(e.target.value) : null })}
                        >
                          <option value="">Not linked</option>
                          {own && !choices.some((e) => e.id === own.id) && (
                            <option value={own.id}>{fullName(own)} ({own.employeeCode})</option>
                          )}
                          {choices.map((e) => (
                            <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap py-3 text-slate-600">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Never'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
