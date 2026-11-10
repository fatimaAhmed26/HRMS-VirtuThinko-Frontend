// Section 1: employment details and the passport-size photograph
import clsx from 'clsx';
import { useEffect, useMemo } from 'react';
import type { Department, EmployeeListItem } from '../../../types';
import { Field, Section, TextInput } from './fields';
import { binder, countryOf, type SectionProps } from './formState';

const TYPES = ['Full-time', 'Part-time', 'Fixed-term', 'Contractor', 'Other'];
const LOCATIONS = ['Manama HQ', 'Riyadh office', 'Remote', 'Client site'];

export function EmploymentSection(props: SectionProps & {
  departments: Department[]; managers: EmployeeListItem[]; photo: File | null; onPhoto: (file: File | null) => void;
}) {
  const { f, set, errors, departments, managers, photo, onPhoto } = props;
  const bind = binder(props);
  const outsourced = f.team === 'OUT';
  const isSaudiNational = countryOf(f) === 'SA' && f.nationality === 'Saudi';

  // preview of the chosen photo; revoked when it changes
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const select = (invalid: boolean) => clsx('input', invalid && 'border-red-400');

  return (
    <Section id="employment" number={1} title="Employment details">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Position / job title" required error={errors.jobTitle}>
            <TextInput {...bind('jobTitle')} maxLength={100} placeholder="e.g. Software Developer" />
          </Field>
          <Field label="Department / project" required error={errors.departmentId}>
            <select className={select(!!errors.departmentId)} value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Select…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Date of joining" required error={errors.hireDate}>
            <TextInput type="date" {...bind('hireDate')} />
          </Field>
          <Field label="Line manager" required error={errors.managerId}>
            <select className={select(!!errors.managerId)} value={f.managerId} onChange={(e) => set('managerId', e.target.value)}>
              <option value="">Select…</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}{m.jobTitle ? ` · ${m.jobTitle}` : ''}</option>)}
            </select>
          </Field>
          <Field label="Employment type" required hint={outsourced ? 'Outsourced (set by the entity choice)' : undefined}>
            <select className="input" value={outsourced ? 'Outsourced' : f.employmentType} disabled={outsourced} onChange={(e) => set('employmentType', e.target.value)}>
              {outsourced ? <option>Outsourced</option> : TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Work location">
            <TextInput {...bind('workLocation')} list="vt-locations" maxLength={100} placeholder={outsourced ? 'Uses the client site if empty' : 'e.g. Manama HQ'} />
            <datalist id="vt-locations">{LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist>
          </Field>
          <Field label="Work email" required hint="Used for the portal login" error={errors.email}>
            <TextInput type="email" {...bind('email')} maxLength={100} placeholder="name@virtuthinko.com" />
          </Field>
          <Field label="Probation ends" error={errors.probationEnd}>
            <TextInput type="date" {...bind('probationEnd')} />
          </Field>
          {f.employmentType === 'Fixed-term' && !outsourced && (
            <Field label="Contract end date" required error={errors.contractEnd}>
              <TextInput type="date" {...bind('contractEnd')} />
            </Field>
          )}
          {isSaudiNational && (
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" className="accent-brand-600" checked={f.siNewScheme} onChange={(e) => set('siNewScheme', e.target.checked)} />
              First GOSI registration on or after 3 July 2024 (new scheme)
            </label>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="flex h-36 w-28 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
            {preview ? <img src={preview} alt="Passport-size photograph" className="h-full w-full object-cover" /> : <>Passport-size<br />photograph</>}
          </div>
          <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            {photo ? 'Change photo' : 'Upload photo'}
            <input type="file" accept=".jpg,.jpeg,.png" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
          </label>
          {photo && <button type="button" className="text-xs text-slate-500 hover:text-red-600" onClick={() => onPhoto(null)}>Remove</button>}
        </div>
      </div>
    </Section>
  );
}
