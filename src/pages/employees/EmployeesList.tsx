import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { GraduationCap, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate, fullName } from '../../lib/format';
import { P } from '../../lib/permissions';
import { EMPLOYMENT_TYPES, type EmploymentType } from '../../types';

// All employees. With internsOnly it becomes the Interns page (interns have no portal login).
export default function EmployeesList({ internsOnly = false }: { internsOnly?: boolean }) {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(internsOnly ? 'Intern' : '');
  const [status, setStatus] = useState<'active' | 'inactive' | ''>('active');
  const [page, setPage] = useState(1);

  const filters = {
    search: search || undefined,
    departmentId: departmentId ? Number(departmentId) : undefined,
    employmentType: (internsOnly ? 'Intern' : employmentType) || undefined,
    status: status || undefined,
    page,
    pageSize: 20,
  };
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeesApi.list(filters),
    placeholderData: keepPreviousData, // keep the table on screen while the next page loads
  });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <>
      <PageHeader
        title={internsOnly ? 'Interns' : 'All employees'}
        subtitle={data ? `${data.total} ${internsOnly ? 'intern' : 'employee'}${data.total === 1 ? '' : 's'}` : undefined}
        actions={can(P.employeeCreate) && (
          internsOnly
            ? <Link to="/interns/new"><Button><GraduationCap className="h-4 w-4" /> Add intern</Button></Link>
            : <Link to="/employees/new"><Button><UserPlus className="h-4 w-4" /> Add employee</Button></Link>
        )}
      />

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Search name, code, email, job title" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} />
          </div>
          <select className="input" value={departmentId} onChange={(e) => resetPage(setDepartmentId)(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex gap-3">
            {!internsOnly && (
              <select className="input" value={employmentType} onChange={(e) => resetPage(setEmploymentType)(e.target.value as EmploymentType | '')}>
                <option value="">All types</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            )}
            <select className="input" value={status} onChange={(e) => resetPage(setStatus)(e.target.value as 'active' | 'inactive' | '')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="">All</option>
            </select>
          </div>
        </div>

        <ErrorMessage error={error} />
        {isLoading && <Loading />}
        {data && data.items.length === 0 && <EmptyState title="No one matches these filters" />}

        {data && data.items.length > 0 && (
          <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Job title</th><th>Department</th><th>Type</th><th>Entity</th><th>Joined</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link to={`/employees/${e.id}`} className="font-medium text-slate-900 hover:text-brand-600">{fullName(e)}</Link>
                      <p className="text-xs text-slate-500">{e.employeeCode} · {e.email}</p>
                    </td>
                    <td>{e.jobTitle ?? '-'}</td>
                    <td>{e.department?.name ?? '-'}</td>
                    <td>{e.employmentType ?? '-'}{e.clientCompany && <p className="text-xs text-slate-500">at {e.clientCompany.name}</p>}</td>
                    <td>{e.country}</td>
                    <td>{fmtDate(e.hireDate)}</td>
                    <td><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
