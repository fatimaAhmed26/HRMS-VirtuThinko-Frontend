import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { CheckCircle2, Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as employeesApi from '../../api/employees';
import * as orgApi from '../../api/organization';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { errorMessage } from '../../lib/api';
import type { Employee } from '../../types';
import { Field, Section, TextInput } from '../employees/onboarding/fields';
import { NATIONALITIES, grid4 } from '../employees/onboarding/formState';
import { INTERN_DOCS, INTERN_TYPES, MAJORS, MAX_FILE, docApplies, type InternDocKey } from './internDocs';

const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = {
  country: 'BH' as 'BH' | 'SA', fullName: '', cprNumber: '', phone: '', personalEmail: '', nationality: 'Bahraini',
  internType: '', university: '', studentId: '', major: '', skills: '',
  internshipStart: '', internshipEnd: '', departmentId: '', managerId: '', academicTutor: '', projectTitle: '', projectSummary: '',
};
type Form = typeof blank;

const fromEmployee = (e: Employee): Form => ({
  country: e.country, fullName: e.fullNameId || `${e.firstName} ${e.lastName}`, cprNumber: e.cprNumber ?? '', phone: e.phone ?? '',
  personalEmail: e.personalEmail ?? e.email, nationality: e.nationality ?? '', internType: e.internType ?? '', university: e.university ?? '', studentId: e.studentId ?? '',
  major: e.major ?? '', skills: e.skills ?? '', internshipStart: day(e.internshipStart), internshipEnd: day(e.internshipEnd),
  departmentId: e.departmentId ? String(e.departmentId) : '', managerId: e.managerId ? String(e.managerId) : '',
  academicTutor: e.academicTutor ?? '', projectTitle: e.projectTitle ?? '', projectSummary: e.projectSummary ?? '',
});

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  const need = (k: keyof Form, label: string) => { if (!f[k].trim()) e[k] = `${label} is required`; };
  need('fullName', 'Full name'); need('cprNumber', 'ID number'); need('phone', 'Mobile'); need('personalEmail', 'Personal email');
  need('internType', 'Intern type'); if (f.internType !== 'graduate') need('university', 'University / institute'); need('internshipStart', 'Start date'); need('internshipEnd', 'End date');
  need('departmentId', 'Department'); need('managerId', 'Industry mentor');
  if (f.fullName.trim() && f.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter the first and last name';
  const digits = f.country === 'SA' ? 10 : 9;
  if (f.cprNumber && !new RegExp(`^\\d{${digits}}$`).test(f.cprNumber)) e.cprNumber = `Must be ${digits} digits`;
  if (f.personalEmail && !EMAIL.test(f.personalEmail)) e.personalEmail = 'Invalid email';
  if (f.internshipStart && f.internshipEnd && f.internshipEnd <= f.internshipStart) e.internshipEnd = 'Must be after the start date';
  return e;
}

function toPayload(f: Form) {
  const words = f.fullName.trim().split(/\s+/);
  const opt = (v: string) => v.trim() || null;
  const email = f.personalEmail.trim();
  return {
    employmentType: 'Intern', jobTitle: 'Intern', country: f.country,
    isNational: (f.country === 'BH' && f.nationality === 'Bahraini') || (f.country === 'SA' && f.nationality === 'Saudi'),
    firstName: words[0].slice(0, 50), lastName: words[words.length - 1].slice(0, 50), fullNameId: f.fullName.trim(),
    cprNumber: f.cprNumber.trim(), phone: f.phone.trim(), email, personalEmail: email, nationality: opt(f.nationality),
    internType: opt(f.internType), university: opt(f.university), studentId: opt(f.studentId), major: opt(f.major), skills: opt(f.skills),
    internshipStart: f.internshipStart, internshipEnd: f.internshipEnd, hireDate: f.internshipStart,
    departmentId: Number(f.departmentId), managerId: Number(f.managerId),
    academicTutor: opt(f.academicTutor), projectTitle: opt(f.projectTitle), projectSummary: opt(f.projectSummary),
  };
}

export function InternForm({ intern }: { intern?: Employee }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setForm] = useState<Form>(() => (intern ? fromEmployee(intern) : blank));
  const [files, setFiles] = useState<Partial<Record<InternDocKey, File>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: number; problems: string[] } | null>(null);

  const departments = useQuery({ queryKey: ['departments'], queryFn: orgApi.departments });
  const mentors = useQuery({ queryKey: ['employees', 'managers'], queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }) });

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((p) => ({ ...p, [k]: v }));
  const bind = (k: keyof Form) => ({ value: f[k], onChange: (v: string) => set(k, v as never), invalid: submitted && !!errors[k] });
  const errors = submitted ? validate(f) : {};
  const onFile = (key: InternDocKey, file: File | null) => {
    if (file && file.size > MAX_FILE) return setFileError(`"${file.name}" is larger than 5 MB`);
    setFileError(null);
    setFiles((p) => { const n = { ...p }; if (file) n[key] = file; else delete n[key]; return n; });
  };
  const already = intern?.documentChecklist ?? {};

  const save = useMutation({
    mutationFn: async () => {
      const checklist = { ...already };
      for (const k of Object.keys(files)) checklist[k] = { received: true };
      const payload = { ...toPayload(f), documentChecklist: checklist };
      const emp = intern ? await employeesApi.update(intern.id, payload as never) : await employeesApi.create(payload);
      const problems: string[] = [];
      for (const d of INTERN_DOCS.filter((x) => docApplies(x, f.internType))) {
        const file = files[d.key];
        if (!file) continue;
        try {
          await documentsApi.upload({ file, employeeId: emp.id, category: d.category, title: d.label });
        } catch (err) {
          problems.push(`${d.label}: ${errorMessage(err)}`);
        }
      }
      return { id: emp.id, problems };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['interns'] });
      if (r.problems.length) setSaved(r);
      else navigate(`/interns/${r.id}/letter`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(f)).length) return window.scrollTo({ top: 0, behavior: 'smooth' });
    save.mutate();
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-slate-900">Intern saved, but some files did not upload</h1>
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">{saved.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        <p className="text-sm text-slate-700">Add them from the Checklist button in the interns list.</p>
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/interns/${saved.id}/letter`)}>Open acceptance letter</Button>
          <Button variant="secondary" onClick={() => navigate('/interns')}>Interns list</Button>
        </div>
      </div>
    );
  }

  const select = (k: keyof Form) => clsx('input', errors[k] && 'border-red-400');
  const months = f.internshipStart && f.internshipEnd && f.internshipEnd > f.internshipStart
    ? Math.round((Date.parse(f.internshipEnd) - Date.parse(f.internshipStart)) / (30.44 * 86_400_000)) : 0;

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-5xl space-y-5 pb-10">
      <div>
        <p className="text-xs text-slate-500"><Link to="/interns" className="hover:underline">Interns</Link> / {intern ? `Edit ${intern.firstName} ${intern.lastName}` : 'New intern'}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{intern ? 'Edit intern' : 'Add intern'}</h1>
        <p className="mt-1 text-sm text-slate-500">Upload the documents, fill in the details, then add the dates and department to generate the acceptance letter.</p>
      </div>

      <Section id="docs" number={1} title="Upload documents">
        <div className={grid4}>
          {INTERN_DOCS.filter((d) => d.key !== 'agreement' && docApplies(d, f.internType)).map((d) => {
            const file = files[d.key];
            const onFileAlready = !file && already[d.key]?.received;
            return (
              <label key={d.key} className={clsx('block cursor-pointer rounded-lg border p-3 text-xs', file || onFileAlready ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-300 bg-slate-50 hover:border-brand-400')}>
                <span className="block text-sm font-semibold text-slate-800">{d.label}</span>
                <span className="block text-slate-500">{d.hint}</span>
                <span className="mt-2 flex items-center gap-1.5 text-slate-700">
                  {file || onFileAlready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <Upload className="h-4 w-4 shrink-0 text-slate-400" />}
                  <span className="truncate">{file ? file.name : onFileAlready ? 'On file · click to replace' : 'Choose file'}</span>
                </span>
                <input type="file" accept={d.accept} className="sr-only" aria-label={`Upload ${d.label}`} onChange={(e) => { onFile(d.key, e.target.files?.[0] ?? null); e.target.value = ''; }} />
              </label>
            );
          })}
        </div>
        <ErrorMessage error={fileError} />
      </Section>

      <Section id="details" number={2} title="Intern details">
        <div className={grid4}>
          <Field label="Full name (as in CPR)" required error={errors.fullName}><TextInput {...bind('fullName')} maxLength={150} /></Field>
          <Field label={f.country === 'SA' ? 'ID / Iqama number' : 'CPR number'} required error={errors.cprNumber}><TextInput {...bind('cprNumber')} inputMode="numeric" maxLength={10} /></Field>
          <Field label="Mobile" required error={errors.phone}><TextInput type="tel" {...bind('phone')} maxLength={20} placeholder="+973 XXXX XXXX" /></Field>
          <Field label="Personal email" required error={errors.personalEmail}><TextInput type="email" {...bind('personalEmail')} maxLength={100} /></Field>
          <Field label="Intern type" required error={errors.internType}>
            <select className="input" value={f.internType} onChange={(e) => set('internType', e.target.value)}>
              <option value="">Select…</option>
              {INTERN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="University / institute" required={f.internType !== 'graduate'} error={errors.university}>
            <TextInput {...bind('university')} maxLength={150} list="vt-universities" />
            <datalist id="vt-universities">{['Bahrain Polytechnic', 'University of Bahrain', 'Ahlia University', 'AMA International University'].map((u) => <option key={u} value={u} />)}</datalist>
          </Field>
          <Field label="Student ID"><TextInput {...bind('studentId')} maxLength={30} /></Field>
          <Field label="Major">
            <TextInput {...bind('major')} maxLength={100} list="vt-majors" />
            <datalist id="vt-majors">{MAJORS.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>
          <Field label="Skills"><TextInput {...bind('skills')} maxLength={255} placeholder="e.g. React, TypeScript, MySQL" /></Field>
          <Field label="Nationality">
            <select className="input" value={f.nationality} onChange={(e) => set('nationality', e.target.value)}>
              <option value="">—</option>
              {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Office">
            <select className="input" value={f.country} onChange={(e) => set('country', e.target.value as 'BH' | 'SA')}>
              <option value="BH">Bahrain</option><option value="SA">KSA</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section id="internship" number={3} title="Internship">
        <div className={grid4}>
          <Field label="Start date" required error={errors.internshipStart}><TextInput type="date" {...bind('internshipStart')} /></Field>
          <Field label="End date" required error={errors.internshipEnd} hint={months ? `About ${months} month${months === 1 ? '' : 's'}` : undefined}><TextInput type="date" {...bind('internshipEnd')} /></Field>
          <Field label="Department" required error={errors.departmentId}>
            <select className={select('departmentId')} value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Select…</option>
              {(departments.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Industry mentor" required error={errors.managerId}>
            <select className={select('managerId')} value={f.managerId} onChange={(e) => set('managerId', e.target.value)}>
              <option value="">Select…</option>
              {(mentors.data?.items ?? []).filter((m) => m.id !== intern?.id && m.employmentType !== 'Intern').map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
            </select>
          </Field>
          <Field label="Academic tutor"><TextInput {...bind('academicTutor')} maxLength={100} /></Field>
          <Field label="Project title" className="sm:col-span-2"><TextInput {...bind('projectTitle')} maxLength={200} /></Field>
        </div>
        <Field label="Project summary" hint="Used in the proposal acceptance form" className="mt-4">
          <textarea className="input min-h-20" maxLength={1000} value={f.projectSummary} onChange={(e) => set('projectSummary', e.target.value)} />
        </Field>
      </Section>

      <ErrorMessage error={departments.error || mentors.error || save.error} />
      {submitted && Object.keys(errors).length > 0 && <ErrorMessage error="Please fix the highlighted fields." />}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/interns')}>Cancel</Button>
        <Button type="submit" loading={save.isPending}>{intern ? 'Save changes' : 'Save & generate acceptance letter'}</Button>
      </div>
    </form>
  );
}
