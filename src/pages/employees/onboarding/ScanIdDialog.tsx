// "Scan ID" in Add employee: read a CPR / Iqama / passport / permit / certificate and fill the form from it
import { useState } from 'react';
import { scanTypeLabel, type ScanResult } from '../../../api/scanner';
import { ScanCard } from '../../../components/scanner/ScanCard';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { NATIONALITIES, emptyEducation, type ChecklistKey, type OnboardingForm } from './formState';

type Patch = Partial<OnboardingForm>;

// The form changes a scan makes, with a readable list to confirm before applying
function toPatch({ type, fields: f }: ScanResult, form: OnboardingForm): { patch: Patch; rows: [string, string][]; checklist: ChecklistKey } {
  const patch: Patch = {};
  const rows: [string, string][] = [];
  const put = <K extends keyof OnboardingForm>(key: K, label: string, value: OnboardingForm[K] | null | undefined) => {
    if (value === null || value === undefined || value === '') return;
    patch[key] = value;
    rows.push([label, String(value)]);
  };
  const nationality = f.nationality && NATIONALITIES.includes(f.nationality) ? f.nationality : null;

  if (type === 'cpr' || type === 'iqama') {
    if (!form.team) {
      put('team', 'Entity', type === 'iqama' ? 'SA' : 'BH');
      rows[rows.length - 1][1] = type === 'iqama' ? 'VirtuThinko Company (KSA)' : 'VirtuThinko W.L.L. (Bahrain)';
    }
    put('fullNameId', 'Full name (ID)', f.fullNameEn);
    put('fullNameArabic', 'Full name (Arabic)', f.fullNameAr);
    put('cprNumber', 'ID number', f.idNumber?.replace(/\D/g, ''));
  }
  if (type === 'passport') {
    put('fullNamePassport', 'Full name (passport)', f.fullNameEn);
    put('passportNumber', 'Passport number', f.idNumber);
    put('passportPlaceOfIssue', 'Place of issue', f.placeOfIssue);
    put('passportIssueDate', 'Issue date', f.issueDate);
    put('passportExpiry', 'Expiry date', f.expiryDate);
    put('placeOfBirth', 'Place of birth', f.placeOfBirth);
  }
  if (type === 'cpr' || type === 'iqama') put('idExpiry', 'ID expiry', f.expiryDate);
  if (type !== 'permit' && type !== 'certificate') {
    put('birthDate', 'Date of birth', f.dateOfBirth);
    put('nationality', 'Nationality', nationality);
    put('gender', 'Gender', f.sex);
    // portal first / last name from the English name, only if HR hasn't typed them
    const words = (f.fullNameEn ?? '').split(/\s+/).filter(Boolean);
    if (words.length > 1 && !form.firstName && !form.lastName) {
      put('firstName', 'First name', words[0].slice(0, 50));
      put('lastName', 'Last name', words[words.length - 1].slice(0, 50));
    }
  }
  if (type === 'permit') {
    put('permitNumber', 'Permit number', f.idNumber);
    put('permitExpiry', 'Permit expiry', f.expiryDate);
  }
  if (type === 'certificate' && f.certificateTitle) {
    const row = { ...emptyEducation(), title: f.certificateTitle, institution: f.issuingBody ?? '', year: f.issueDate?.slice(0, 4) ?? '' };
    const rest = form.education.filter((q) => q.title.trim()); // replace the empty starter row
    patch.education = [...rest, row];
    rows.push(['Qualification', [f.certificateTitle, f.issuingBody].filter(Boolean).join(' · ')]);
  }
  if (f.nationality && !nationality) rows.push(['Nationality', `${f.nationality} (not in the list - choose it yourself)`]);

  const checklist: ChecklistKey = type === 'passport' ? 'passport' : type === 'permit' ? 'permit' : type === 'certificate' ? 'education' : 'nationalId';
  return { patch, rows, checklist };
}

export function ScanIdDialog({ open, onClose, form, onApply }: {
  open: boolean;
  onClose: () => void;
  form: OnboardingForm;
  onApply: (patch: Patch, file: File, checklist: ChecklistKey) => void;
}) {
  const [scan, setScan] = useState<{ result: ScanResult; file: File } | null>(null);
  const preview = scan ? toPatch(scan.result, form) : null;
  const close = () => { setScan(null); onClose(); };

  return (
    <Modal title="Scan an ID document" open={open} onClose={close}>
      <div className="max-h-[75vh] space-y-4 overflow-y-auto">
        <ScanCard initialType="cpr" types={['cpr', 'iqama', 'passport', 'permit', 'certificate']}
          onRead={(result, file) => setScan({ result, file })} onReset={() => setScan(null)} />

        {scan && preview && (
          <div className="rounded-lg border border-slate-200 p-4">
            {(!scan.result.fields.matchesType || !scan.result.fields.readable || scan.result.fields.notes.length > 0) && (
              <ul className="mb-3 list-disc space-y-1 rounded bg-amber-50 py-2 pl-7 pr-2 text-xs text-amber-900">
                {!scan.result.fields.matchesType && <li>This does not look like a {scanTypeLabel(scan.result.type)}.</li>}
                {!scan.result.fields.readable && <li>Parts were hard to read. Check the filled fields carefully.</li>}
                {scan.result.fields.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}
            {scan.result.match && (
              <p className="mb-3 rounded bg-blue-50 px-3 py-2 text-xs text-blue-800">
                This number already belongs to {scan.result.match.firstName} {scan.result.match.lastName} ({scan.result.match.employeeCode}).
              </p>
            )}
            {preview.rows.length ? (
              <>
                <p className="text-sm font-medium text-slate-700">These fields will be filled:</p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  {preview.rows.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-slate-800" dir="auto">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-xs text-slate-500">The file is also attached to the documents checklist.</p>
              </>
            ) : <p className="text-sm text-slate-500">Nothing could be read from this document. Try a clearer photo.</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
              <Button type="button" disabled={!preview.rows.length} onClick={() => { onApply(preview.patch, scan.file, preview.checklist); close(); }}>
                Fill the form
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
