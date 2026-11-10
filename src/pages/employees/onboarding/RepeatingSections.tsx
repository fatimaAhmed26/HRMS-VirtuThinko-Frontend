// Sections 6-8: rows that can be added and removed (dependants, qualifications, previous employment)
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Dependant } from '../../../types';
import { Field, Radios, Section, SubBox, TextInput } from './fields';
import {
  binder, emptyCertification, emptyDependant, emptyEducation, emptyEmployer,
  type SectionProps, type YesNo, YES_NO, grid4 } from './formState';

const RELATIONSHIPS: Dependant['relationship'][] = ['Spouse', 'Son', 'Daughter', 'Parent', 'Other'];

// replace one row of a list without mutating it
const patch = <T,>(rows: T[], i: number, change: Partial<T>) => rows.map((r, j) => (j === i ? { ...r, ...change } : r));

function AddButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="mt-3 rounded-lg border border-dashed border-slate-400 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-600 hover:text-brand-600 disabled:opacity-50">
      {children}
    </button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

const cell = 'input min-w-28';

export function DependantsSection({ f, set, errors }: SectionProps) {
  const rows = f.dependants;
  return (
    <Section id="dependants" number={6} title="Dependants" hint="If applicable — used for medical insurance and residence processing.">
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table">
            <thead><tr><th>Full name (as in passport / ID)</th><th>Relationship</th><th>Date of birth</th><th>Nationality</th><th>Passport / ID no.</th><th /></tr></thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={i}>
                  <td><input className={cell} value={d.fullName} maxLength={150} aria-label={`Dependant ${i + 1} name`} onChange={(e) => set('dependants', patch(rows, i, { fullName: e.target.value }))} /></td>
                  <td>
                    <select className="input" value={d.relationship} aria-label={`Dependant ${i + 1} relationship`} onChange={(e) => set('dependants', patch(rows, i, { relationship: e.target.value as Dependant['relationship'] }))}>
                      {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><input type="date" className="input" value={d.birthDate} aria-label={`Dependant ${i + 1} date of birth`} onChange={(e) => set('dependants', patch(rows, i, { birthDate: e.target.value }))} /></td>
                  <td><input className={cell} value={d.nationality} maxLength={50} aria-label={`Dependant ${i + 1} nationality`} onChange={(e) => set('dependants', patch(rows, i, { nationality: e.target.value }))} /></td>
                  <td><input className={cell} value={d.idNumber} maxLength={30} aria-label={`Dependant ${i + 1} ID number`} onChange={(e) => set('dependants', patch(rows, i, { idNumber: e.target.value }))} /></td>
                  <td><RemoveButton label="Remove dependant" onClick={() => set('dependants', rows.filter((_, j) => j !== i))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {errors.dependants && <p className="mt-2 text-xs text-red-600">{errors.dependants}</p>}
      <AddButton onClick={() => set('dependants', [...rows, emptyDependant()])} disabled={rows.length >= 20}>+ Add dependant</AddButton>
    </Section>
  );
}

export function QualificationsSection(props: SectionProps) {
  const { f, set, errors } = props;
  const bind = binder(props);
  const edu = f.education;
  const certs = f.certifications;
  return (
    <Section id="qualifications" number={7} title="Educational & professional qualifications">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Education</h3>
      {edu.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table">
            <thead><tr><th>Qualification / degree</th><th>Institution</th><th>Country</th><th>Year</th><th>Grade / GPA</th><th /></tr></thead>
            <tbody>
              {edu.map((q, i) => (
                <tr key={i}>
                  <td><input className={cell} value={q.title} maxLength={150} aria-label={`Qualification ${i + 1}`} onChange={(e) => set('education', patch(edu, i, { title: e.target.value }))} /></td>
                  <td><input className={cell} value={q.institution} maxLength={150} aria-label={`Institution ${i + 1}`} onChange={(e) => set('education', patch(edu, i, { institution: e.target.value }))} /></td>
                  <td><input className={cell} value={q.country} maxLength={50} aria-label={`Country ${i + 1}`} onChange={(e) => set('education', patch(edu, i, { country: e.target.value }))} /></td>
                  <td><input className="input w-20" inputMode="numeric" maxLength={4} value={q.year} aria-label={`Year ${i + 1}`} onChange={(e) => set('education', patch(edu, i, { year: e.target.value.replace(/\D/g, '') }))} /></td>
                  <td><input className="input w-24" value={q.grade} maxLength={20} aria-label={`Grade ${i + 1}`} onChange={(e) => set('education', patch(edu, i, { grade: e.target.value }))} /></td>
                  <td><RemoveButton label="Remove qualification" onClick={() => set('education', edu.filter((_, j) => j !== i))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddButton onClick={() => set('education', [...edu, emptyEducation()])} disabled={edu.length + certs.length >= 30}>+ Add qualification</AddButton>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-700">Professional certifications / licences</h3>
      {certs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="table">
            <thead><tr><th>Certification / licence</th><th>Issuing body</th><th>Date obtained</th><th>Expiry date</th><th /></tr></thead>
            <tbody>
              {certs.map((c, i) => (
                <tr key={i}>
                  <td><input className={cell} value={c.title} maxLength={150} aria-label={`Certification ${i + 1}`} onChange={(e) => set('certifications', patch(certs, i, { title: e.target.value }))} /></td>
                  <td><input className={cell} value={c.institution} maxLength={150} aria-label={`Issuing body ${i + 1}`} onChange={(e) => set('certifications', patch(certs, i, { institution: e.target.value }))} /></td>
                  <td><input type="date" className="input" value={c.obtainedDate} aria-label={`Date obtained ${i + 1}`} onChange={(e) => set('certifications', patch(certs, i, { obtainedDate: e.target.value }))} /></td>
                  <td><input type="date" className="input" value={c.expiryDate} aria-label={`Expiry date ${i + 1}`} onChange={(e) => set('certifications', patch(certs, i, { expiryDate: e.target.value }))} /></td>
                  <td><RemoveButton label="Remove certification" onClick={() => set('certifications', certs.filter((_, j) => j !== i))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddButton onClick={() => set('certifications', [...certs, emptyCertification()])} disabled={edu.length + certs.length >= 30}>+ Add certification</AddButton>
      {errors.qualifications && <p className="mt-2 text-xs text-red-600">{errors.qualifications}</p>}

      <Field label="Languages spoken" hint="Indicate level: basic / good / fluent" className="mt-5">
        <TextInput {...bind('languages')} maxLength={255} placeholder="e.g. Arabic – fluent, English – good" />
      </Field>
    </Section>
  );
}

export function PreviousEmploymentSection({ f, set, errors }: SectionProps) {
  const rows = f.employers;
  const text = (i: number, key: keyof (typeof rows)[number], max: number, type = 'text') => (
    <input type={type} className="input" maxLength={max} value={rows[i][key]} onChange={(e) => set('employers', patch(rows, i, { [key]: e.target.value }))} />
  );
  return (
    <Section id="previous" number={8} title="Previous employment & references"
      hint="Most recent employer first. The reference should be a manager or HR representative who can confirm employment.">
      <div className="space-y-3">
        {rows.map((_, i) => (
          <SubBox key={i} title={`Previous employer ${i + 1}`}
            action={rows.length > 1 && <RemoveButton label={`Remove previous employer ${i + 1}`} onClick={() => set('employers', rows.filter((__, j) => j !== i))} />}>
            <div className={grid4}>
              <Field label="Employer name">{text(i, 'employerName', 150)}</Field>
              <Field label="Job title">{text(i, 'jobTitle', 100)}</Field>
              <Field label="Employed from">{text(i, 'fromDate', 10, 'date')}</Field>
              <Field label="Employed to">{text(i, 'toDate', 10, 'date')}</Field>
              <Field label="Reason for leaving" className="sm:col-span-2">{text(i, 'reasonForLeaving', 255)}</Field>
              <Field label="Reference contact name">{text(i, 'refName', 100)}</Field>
              <Field label="Contact job title">{text(i, 'refJobTitle', 100)}</Field>
              <Field label="Contact phone">{text(i, 'refPhone', 20, 'tel')}</Field>
              <Field label="Contact email">{text(i, 'refEmail', 100, 'email')}</Field>
            </div>
          </SubBox>
        ))}
      </div>
      {errors.employers && <p className="mt-2 text-xs text-red-600">{errors.employers}</p>}
      <AddButton onClick={() => set('employers', [...rows, emptyEmployer()])} disabled={rows.length >= 3}>+ Add previous employer</AddButton>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <Radios<'yes' | 'no'> name="mayContact" label="May VirtuThinko contact these employers to verify employment?" required
          options={[...YES_NO]} value={f.mayContactEmployers} onChange={(v) => set('mayContactEmployers', v as YesNo)} error={errors.mayContactEmployers} />
        <Radios<'yes' | 'no'> name="restrictive" label="Bound by a non-compete, confidentiality or notice obligation to a current / previous employer?" required
          options={[YES_NO[1], YES_NO[0]]} value={f.hasRestrictiveClauses} onChange={(v) => set('hasRestrictiveClauses', v as YesNo)} />
      </div>
    </Section>
  );
}
