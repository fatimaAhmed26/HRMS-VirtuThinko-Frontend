import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import * as employeesApi from '../../api/employees';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { todayKey } from '../../lib/leave';
import type { EmployeeListItem } from '../../types';

// Download an intern's acceptance letter. Dates come from their internship contract;
// HR can change the letter date and the duration shown (e.g. "12 Weeks").
export function AcceptanceLetterDialog({ intern, onClose }: { intern: EmployeeListItem | null; onClose: () => void }) {
  return (
    <Modal title="Internship acceptance letter" open={!!intern} onClose={onClose}>
      {intern && <LetterForm key={intern.id} intern={intern} onClose={onClose} />}
    </Modal>
  );
}

function LetterForm({ intern, onClose }: { intern: EmployeeListItem; onClose: () => void }) {
  const [date, setDate] = useState(todayKey());
  const [weeks, setWeeks] = useState('');
  const download = useMutation({
    mutationFn: () => employeesApi.acceptanceLetter(intern.id, { date, weeks: weeks ? Number(weeks) : undefined }),
    onSuccess: onClose,
  });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    download.mutate();
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        For <b>{intern.firstName} {intern.lastName}</b>. Start and end dates come from the internship contract.
        The letter has no signature; print it and sign by hand.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="letterDate">Letter date</label>
          <input id="letterDate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="weeks">Duration in weeks</label>
          <input id="weeks" type="number" min={1} max={104} className="input" placeholder="Calculated" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
        </div>
      </div>
      <ErrorMessage error={download.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={download.isPending}><Download className="h-4 w-4" /> Download PDF</Button>
      </div>
    </form>
  );
}
