import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/notifications';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorMessage } from '../components/ui/Feedback';
import { PageHeader } from '../components/ui/PageHeader';
import { Loading } from '../components/ui/Spinner';
import { fmtDateTime } from '../lib/format';
import type { AppNotification } from '../types';

export default function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ['notifications', 'list'], queryFn: () => api.list({ pageSize: 50 }) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const readAll = useMutation({ mutationFn: api.markAllRead, onSuccess: refresh });

  async function open(n: AppNotification) {
    if (!n.readAt) await api.markRead(n.id);
    refresh();
    if (n.link) navigate(n.link);
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle={data ? `${data.unread} unread` : undefined}
        actions={<Button variant="secondary" onClick={() => readAll.mutate()} loading={readAll.isPending} disabled={!data?.unread}>Mark all as read</Button>} />
      <Card>
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {data && data.items.length === 0 && <EmptyState title="No notifications yet" />}
        <ul className="divide-y divide-slate-100">
          {data?.items.map((n) => (
            <li key={n.id}>
              <button onClick={() => open(n)} className="flex w-full items-start gap-3 px-1 py-3 text-left hover:bg-slate-50">
                <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-brand-600')} />
                <span className="flex-1">
                  <span className={clsx('block text-sm', !n.readAt && 'font-semibold')}>{n.title}</span>
                  {n.body && <span className="block text-sm text-slate-500">{n.body}</span>}
                  <span className="block text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
