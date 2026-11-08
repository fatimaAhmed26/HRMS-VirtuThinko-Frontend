import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as employeesApi from '../../api/employees';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Initials } from '../../components/ui/Initials';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';

// Directory (design p.71): work contact details only
export default function Directory() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300); // wait until the user stops typing
    return () => clearTimeout(t);
  }, [search]);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['directory', debounced],
    queryFn: () => employeesApi.directory(debounced),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Directory" subtitle="Work contact details only." />
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search colleagues, job titles, departments" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {isLoading && <Loading />}
      <ErrorMessage error={error} />
      {!isLoading && data.length === 0 && <EmptyState title="No colleagues match your search" />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Initials firstName={p.firstName} lastName={p.lastName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
              <p className="truncate text-xs text-slate-500" title={p.department?.name}>{p.jobTitle ?? '-'}</p>
              <a href={`mailto:${p.email}`} className="truncate text-xs text-brand-600 hover:underline">{p.email}</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
