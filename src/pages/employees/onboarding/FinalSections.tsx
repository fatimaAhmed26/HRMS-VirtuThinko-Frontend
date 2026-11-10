// Sections 9-12 and the HR-only block
import clsx from 'clsx';
import { CheckCircle2, X } from 'lucide-react';
import { Field, Radios, Section, TextInput } from './fields';
import { BLOOD_GROUPS, CHECKLIST, binder, countryOf, currencyOf, type ChecklistKey, type SectionProps, type YesNo, YES_NO, grid4 } from './formState';

export function MedicalSection(props: SectionProps) {
  const { f, set, errors } = props;
  const bind = binder(props);
  return (
    <Section id="medical" number={9} title="Medical information"
      badge={<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Confidential</span>}
      hint="Voluntary. Visible to authorised HR only; used for safety, emergency care and medical insurance.">
      <Radios<'yes' | 'no'> name="medical" required
        label="Any medical condition, allergy or disability the company should know about for safety, emergency response or workplace needs?"
        options={[YES_NO[1], YES_NO[0]]} value={f.hasMedicalCondition} onChange={(v) => set('hasMedicalCondition', v as YesNo)} />
      {f.hasMedicalCondition === 'yes' && (
        <Field label="Details" required className="mt-3" error={errors.medicalDetails}>
          <textarea className={clsx('input min-h-16', errors.medicalDetails && 'border-red-400')} maxLength={2000}
            value={f.medicalDetails} onChange={(e) => set('medicalDetails', e.target.value)} />
        </Field>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Blood group (optional)">
          <select className="input" value={f.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
            <option value="">—</option>
            {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Regular medication" hint="If relevant to emergency care" className="sm:col-span-2">
          <TextInput {...bind('regularMedication')} maxLength={1000} />
        </Field>
      </div>
    </Section>
  );
}

export function SalarySection(props: SectionProps & { showSalary: boolean }) {
  const { errors, showSalary } = props;
  const bind = binder(props);
  const saudi = countryOf(props.f) === 'SA';
  return (
    <Section id="salary" number={10} title="Salary payment details">
      <div className={grid4}>
        <Field label="Bank name" required error={errors.bankName}><TextInput {...bind('bankName')} maxLength={100} /></Field>
        <Field label="Branch / country" required error={errors.bankBranch}><TextInput {...bind('bankBranch')} maxLength={100} /></Field>
        <Field label="Account holder name" required hint="Must be the employee's own name" error={errors.bankAccountHolder}>
          <TextInput {...bind('bankAccountHolder')} maxLength={150} />
        </Field>
        <Field label="IBAN" required hint="Required for the wage protection system" error={errors.bankAccountNumber}>
          <TextInput {...bind('bankAccountNumber')} maxLength={42} autoComplete="off" placeholder={saudi ? 'SA00 0000 0000 0000 0000 0000' : 'BH00 XXXX 0000 0000 0000 00'} />
        </Field>
        {showSalary && (
          <Field label={`Monthly salary (${currencyOf(props.f)})`} required hint="Saved as the first contract (basic salary)" error={errors.monthlySalary}>
            <TextInput {...bind('monthlySalary')} inputMode="decimal" placeholder="0.000" />
          </Field>
        )}
      </div>
    </Section>
  );
}

export function ChecklistSection({ f, set, files, onFile }: SectionProps & {
  files: Partial<Record<ChecklistKey, File>>; onFile: (key: ChecklistKey, file: File | null) => void;
}) {
  const row = (key: ChecklistKey) => f.checklist[key] ?? { na: false, received: false };
  const tick = (key: ChecklistKey, change: { na?: boolean; received?: boolean }) =>
    set('checklist', { ...f.checklist, [key]: { ...row(key), ...change } });

  return (
    <Section id="documents" number={11} title="Documents checklist">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="table">
          <thead><tr><th>Document</th><th>File</th><th className="text-center">N/A</th><th className="text-center">HR received</th></tr></thead>
          <tbody>
            {CHECKLIST.map((item) => {
              const file = files[item.key];
              const r = row(item.key);
              return (
                <tr key={item.key} className={clsx(r.na && 'text-slate-400')}>
                  <td>{item.label}</td>
                  <td>
                    {file ? (
                      <span className="flex max-w-56 items-center gap-1.5 text-xs text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <span className="truncate" title={file.name}>{file.name}</span>
                        <button type="button" aria-label={`Remove ${item.label}`} className="text-slate-400 hover:text-red-600" onClick={() => onFile(item.key, null)}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <label className={clsx('inline-block rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700', r.na ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50')}>
                        Upload
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={r.na} aria-label={`Upload ${item.label}`}
                          onChange={(e) => { onFile(item.key, e.target.files?.[0] ?? null); e.target.value = ''; }} />
                      </label>
                    )}
                  </td>
                  <td className="text-center">
                    <input type="checkbox" className="accent-brand-600" aria-label={`${item.label} not applicable`} checked={r.na}
                      onChange={(e) => { tick(item.key, { na: e.target.checked, received: false }); if (e.target.checked) onFile(item.key, null); }} />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" className="accent-brand-600" aria-label={`${item.label} received by HR`} checked={r.received} disabled={r.na}
                      onChange={(e) => tick(item.key, { received: e.target.checked })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">PDF, JPEG or PNG · max 5 MB each. Files are uploaded when the employee is added.</p>
    </Section>
  );
}

export function DeclarationSection(props: SectionProps) {
  const { f, set } = props;
  const bind = binder(props);
  const entity = countryOf(f) === 'SA' ? 'VirtuThinko Company' : 'VirtuThinko W.L.L.';
  const law = countryOf(f) === 'SA'
    ? { labour: 'the Saudi Labor Law (Royal Decree M/51)', data: 'the Saudi Personal Data Protection Law (Royal Decree M/19 of 2021)' }
    : { labour: 'the Bahrain Labour Law for the Private Sector (Law No. 36 of 2012)', data: 'the Bahrain Personal Data Protection Law (Law No. 30 of 2018)' };
  return (
    <Section id="declaration" number={12} title="Employee declaration & consent">
      <ol className="list-decimal space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 pl-8 text-sm text-slate-700">
        <li>The information and documents I have provided are true, complete and accurate, and my names and ID details match my official documents.</li>
        <li>False, forged or misleading information may lead to withdrawal of the offer or disciplinary action up to termination, under {law.labour} and company policy.</li>
        <li>I will inform HR in writing of any change to my personal, contact, marital, dependant, emergency contact, residence permit or bank details.</li>
        <li>I consent to {entity} processing my personal data (including any health information I disclose) for recruitment, payroll, insurance, social insurance, immigration and legal compliance, under {law.data}. It is shared only where necessary with authorities, insurers, banks and clients, and I may request access or correction through HR.</li>
        <li>I authorise the company to verify my identity, qualifications and employment history with the institutions and employers named.</li>
      </ol>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" className="accent-brand-600" checked={f.declarationAccepted} onChange={(e) => set('declarationAccepted', e.target.checked)} />
        The employee has read and accepts the declaration and consent
      </label>
      <div className={clsx(grid4, 'mt-4')}>
        <Field label="Employee name"><TextInput {...bind('declarationName')} maxLength={150} /></Field>
        <Field label="Date"><TextInput type="date" {...bind('declarationDate')} /></Field>
        <Field label="Place"><TextInput {...bind('declarationPlace')} maxLength={100} /></Field>
        <Field label="Employee signature">
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">Signed on the printed form, or electronically once the employee form link is available</div>
        </Field>
      </div>
    </Section>
  );
}

export function HrOnlySection(props: SectionProps & { verifierName: string }) {
  const bind = binder(props);
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <h2 className="text-base font-semibold text-slate-900">For HR use only</h2>
      <div className={clsx(grid4, 'mt-4')}>
        <Field label="Received & verified by" hint="The HR user saving this form">
          <input className="input" value={props.verifierName} disabled />
        </Field>
        <Field label="Date" hint="Today if empty"><TextInput type="date" {...bind('verifiedAt')} /></Field>
        <Field label="Employee ID"><input className="input" value="" placeholder="Auto-generated" disabled /></Field>
        <Field label="Remarks"><TextInput {...bind('hrRemarks')} maxLength={500} /></Field>
      </div>
    </section>
  );
}
