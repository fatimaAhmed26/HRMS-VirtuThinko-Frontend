// Profile tab "History" (design screen 12): the audit log for this employee, in plain words
import { useQuery } from '@tanstack/react-query';
import * as employeesApi from '../../../api/employees';
import type { HistoryEntry } from '../../../api/employees';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { fmtDateTime, humanize } from '../../../lib/format';
import { Panel } from './ui';

// "bankAccountNumber" → "bank account number"
const words = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/\d+/g, ' $& ').trim().toLowerCase();

function describe(h: HistoryEntry) {
  const c = (h.changes ?? {}) as Record<string, unknown>;
  switch (h.action) {
    case 'employee.create': return `Added to the portal${c.employeeCode ? ` as ${c.employeeCode}` : ''}`;
    case 'employee.update': {
      const fields = Object.keys(c);
      if (!fields.length) return 'Details updated';
      const shown = fields.slice(0, 4).map(words).join(', ');
      return `Changed ${shown}${fields.length > 4 ? ` and ${fields.length - 4} more` : ''}`;
    }
    case 'employee.deactivate': return `Deactivated${c.reason ? `: ${c.reason}` : ''}`;
    case 'employee.reactivate': return 'Reactivated';
    case 'employee.acceptance_letter': return 'Internship acceptance letter generated';
    case 'letter.issued': return `${c.letter ?? 'Letter'} issued${c.reference ? ` (${c.reference})` : ''}`;
    default: return humanize(h.action.replace(/\./g, ' '));
  }
}

export function HistoryTab({ employeeId }: { employeeId: number }) {
  const history = useQuery({ queryKey: ['employees', employeeId, 'history'], queryFn: () => employeesApi.history(employeeId) });

  return (
    <Panel title="History & audit log">
      <ErrorMessage error={history.error} />
      {history.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !history.data?.length ? (
        <p className="text-sm text-slate-500">Nothing recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {history.data.map((h) => (
            <li key={h.id} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[11rem_1fr_auto] sm:gap-4">
              <span className="text-slate-500">{fmtDateTime(h.createdAt)}</span>
              <span className="text-slate-800">{describe(h)}</span>
              <span className="text-xs text-slate-500">{h.actor?.username ?? 'System'}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
