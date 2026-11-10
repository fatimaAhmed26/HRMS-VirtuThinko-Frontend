// Document scanner (design screen 25): read a CPR / passport / Iqama / permit / certificate,
// check the details, match an employee, save the file to their documents with an expiry reminder
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import { scanTypeLabel, type ScanResult, type ScanType, type ScannedFields } from '../../api/scanner';
import { useAuth } from '../../auth/useAuth';
import { ScanCard } from '../../components/scanner/ScanCard';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { P } from '../../lib/permissions';

type Draft = Record<keyof Omit<ScannedFields, 'matchesType' | 'readable' | 'notes'>, string>;

const toDraft = (f: ScannedFields): Draft => ({
  fullNameEn: f.fullNameEn ?? '', fullNameAr: f.fullNameAr ?? '', idNumber: f.idNumber ?? '', dateOfBirth: f.dateOfBirth ?? '',
  placeOfBirth: f.placeOfBirth ?? '', nationality: f.nationality ?? '', sex: f.sex ?? '', issueDate: f.issueDate ?? '',
  expiryDate: f.expiryDate ?? '', placeOfIssue: f.placeOfIssue ?? '', employer: f.employer ?? '',
  certificateTitle: f.certificateTitle ?? '', issuingBody: f.issuingBody ?? '',
});

// which fields each document type shows, in order
const FIELDS: Record<ScanType, [keyof Draft, string, 'text' | 'date'][]> = {
  cpr: [['fullNameEn', 'Full name (EN)', 'text'], ['fullNameAr', 'Full name (AR)', 'text'], ['idNumber', 'CPR number', 'text'],
    ['dateOfBirth', 'Date of birth', 'date'], ['nationality', 'Nationality', 'text'], ['expiryDate', 'Expiry date', 'date']],
  iqama: [['fullNameEn', 'Full name (EN)', 'text'], ['fullNameAr', 'Full name (AR)', 'text'], ['idNumber', 'ID / Iqama number', 'text'],
    ['dateOfBirth', 'Date of birth', 'date'], ['nationality', 'Nationality', 'text'], ['expiryDate', 'Expiry date', 'date']],
  passport: [['fullNameEn', 'Full name', 'text'], ['idNumber', 'Passport number', 'text'], ['nationality', 'Nationality', 'text'],
    ['dateOfBirth', 'Date of birth', 'date'], ['placeOfBirth', 'Place of birth', 'text'], ['placeOfIssue', 'Place of issue', 'text'],
    ['issueDate', 'Issue date', 'date'], ['expiryDate', 'Expiry date', 'date']],
  permit: [['fullNameEn', 'Full name', 'text'], ['idNumber', 'Permit number', 'text'], ['employer', 'Employer', 'text'],
    ['issueDate', 'Issue date', 'date'], ['expiryDate', 'Expiry date', 'date']],
  certificate: [['fullNameEn', 'Name on certificate', 'text'], ['certificateTitle', 'Qualification / certification', 'text'],
    ['issuingBody', 'Institution / issuing body', 'text'], ['issueDate', 'Date awarded', 'date'], ['expiryDate', 'Expiry date (if any)', 'date']],
};

const CATEGORY: Record<ScanType, string> = { cpr: 'id_copy', iqama: 'id_copy', passport: 'id_copy', permit: 'id_copy', certificate: 'certificate' };

// Employee record fields the scan can update
function recordUpdate(type: ScanType, d: Draft): Record<string, string> {
  const pick = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v.trim()));
  if (type === 'cpr' || type === 'iqama') return pick({ cprNumber: d.idNumber, idExpiry: d.expiryDate, fullNameId: d.fullNameEn, fullNameArabic: d.fullNameAr });
  if (type === 'passport') return pick({ passportNumber: d.idNumber, passportIssueDate: d.issueDate, passportExpiry: d.expiryDate, passportPlaceOfIssue: d.placeOfIssue, fullNamePassport: d.fullNameEn });
  if (type === 'permit') return pick({ permitNumber: d.idNumber, permitExpiry: d.expiryDate });
  return {};
}

const REMIND = [{ days: 90, label: '3 months before' }, { days: 30, label: '1 month before' }, { days: 7, label: '7 days before' }];

export default function DocumentScanner() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [scan, setScan] = useState<{ result: ScanResult; file: File } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [remind, setRemind] = useState(90);
  const [updateRecord, setUpdateRecord] = useState(true);
  const [savedTo, setSavedTo] = useState<{ id: number; name: string } | null>(null);
  const [cardKey, setCardKey] = useState(0); // remounts the scan card for "scan another"

  const people = useQuery({
    queryKey: ['employees', 'scanner-pick', search],
    queryFn: () => employeesApi.list({ search: search || undefined, pageSize: 20 }),
    enabled: !!scan,
  });

  function onRead(result: ScanResult, file: File) {
    setScan({ result, file });
    setDraft(toDraft(result.fields));
    setEmployeeId(result.match ? String(result.match.id) : '');
    setSavedTo(null);
    save.reset();
  }

  function discard() {
    setScan(null);
    setDraft(null);
    setEmployeeId('');
    setCardKey((k) => k + 1);
  }

  const type = scan?.result.type;
  const canUpdateRecord = can(P.employeeEdit) && type !== 'certificate';

  const save = useMutation({
    mutationFn: async () => {
      if (!scan || !draft || !type) return null;
      const id = Number(employeeId);
      const title = type === 'certificate' && draft.certificateTitle ? draft.certificateTitle : scanTypeLabel(type);
      await documentsApi.upload({
        file: scan.file, employeeId: id, category: CATEGORY[type], title,
        expiryDate: draft.expiryDate || undefined,
        remindDaysBefore: draft.expiryDate ? remind : undefined,
      });
      const changes = recordUpdate(type, draft);
      if (canUpdateRecord && updateRecord && Object.keys(changes).length) await employeesApi.update(id, changes);
      return id;
    },
    onSuccess: (id) => {
      if (!id) return;
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      const person = people.data?.items.find((p) => p.id === id) ?? scan?.result.match;
      setSavedTo({ id, name: person ? `${person.firstName} ${person.lastName}` : 'the employee' });
      discard();
    },
  });

  const match = scan?.result.match;
  const fields = scan?.result.fields;
  const options = people.data?.items ?? [];
  // keep the matched employee in the list even when the search hides them
  const choices = match && !options.some((o) => o.id === match.id) ? [match, ...options] : options;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-xs text-slate-500"><Link to="/employees" className="hover:underline">Employee management</Link> / Document scanner</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Document scanner</h1>
        <p className="mt-1 text-sm text-slate-500">Scan or upload an ID document. The details are read and saved to the employee's profile.</p>
      </div>

      {savedTo && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Saved to <Link to={`/employees/${savedTo.id}`} className="font-medium underline">{savedTo.name}'s documents</Link>.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ScanCard key={cardKey} onRead={onRead} onReset={discard} />

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Details read from the document</h2>
          {!scan || !draft || !type || !fields ? (
            <p className="mt-6 text-center text-sm text-slate-400">Choose the document type, add a photo or PDF, then press "Read document".</p>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); if (employeeId) save.mutate(); }}>
              {(!fields.matchesType || !fields.readable || fields.notes.length > 0) && (
                <ul className="list-disc space-y-1 rounded-lg border border-amber-200 bg-amber-50 py-2 pl-8 pr-3 text-xs text-amber-900">
                  {!fields.matchesType && <li>This does not look like a {scanTypeLabel(type)}. Check the document type.</li>}
                  {!fields.readable && <li>Parts of the image were hard to read. Check the details carefully or use a clearer photo.</li>}
                  {fields.notes.map((n) => <li key={n}>{n}</li>)}
                </ul>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FIELDS[type].map(([key, label, kind]) => (
                  <label key={key} className="block">
                    <span className="label">{label}</span>
                    <input type={kind} className="input" value={draft[key]} dir={key === 'fullNameAr' ? 'rtl' : undefined}
                      maxLength={150} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <span className="label">Save to employee</span>
                  <input className="input mb-2" placeholder="Search by name or employee ID…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" />
                  <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} aria-label="Save to employee">
                    <option value="">{match ? 'Choose…' : 'No employee matched this number - choose…'}</option>
                    {choices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} · {p.employeeCode}{match?.id === p.id ? ' (matched by number)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="block">
                  <span className="label">Remind HR before expiry</span>
                  <select className="input" value={remind} disabled={!draft.expiryDate} onChange={(e) => setRemind(Number(e.target.value))}>
                    {REMIND.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
                  </select>
                  {!draft.expiryDate && <span className="mt-1 block text-xs text-slate-500">No expiry date, so no reminder</span>}
                </label>
              </div>

              {canUpdateRecord && (
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="accent-brand-600" checked={updateRecord} onChange={(e) => setUpdateRecord(e.target.checked)} />
                  Also update the number, dates and names on the employee's record
                </label>
              )}

              <ErrorMessage error={save.error} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={discard}>Discard</Button>
                <Button type="submit" disabled={!employeeId} loading={save.isPending}>Save to profile</Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
