// Step 1: the employing entity, and the client details when the person is outsourced
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { ClientCompany } from '../../../types';
import { Field, Section, SubBox, TextInput } from './fields';
import { binder, type SectionProps, type Team, grid4 } from './formState';

const TEAMS: { value: Team; title: string; hint: string }[] = [
  { value: 'BH', title: 'VirtuThinko W.L.L.', hint: 'Kingdom of Bahrain · CPR · BHD' },
  { value: 'SA', title: 'VirtuThinko Company', hint: 'Kingdom of Saudi Arabia · Iqama · SAR' },
  { value: 'OUT', title: 'Outsourced to client', hint: 'Our employee, working at a client (e.g. NBB, BBK)' },
];

export function EntitySection(props: SectionProps & { clients: ClientCompany[] }) {
  const { f, set, errors, clients } = props;
  const bind = binder(props);

  return (
    <Section id="entity" title="Employing entity" hint="Sets the ID type, social insurance, labour law and who runs payroll.">
      <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Employing entity">
        {TEAMS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={f.team === t.value}
              onClick={() => set('team', t.value)}
              className={clsx(
                'flex items-start gap-3 rounded-lg border p-3 text-left transition',
                f.team === t.value ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-300 bg-white hover:border-slate-400'
              )}
            >
              <span className={clsx('mt-0.5 h-4 w-4 shrink-0 rounded-full border-2', f.team === t.value ? 'border-brand-600 bg-white ring-[3px] ring-inset ring-brand-600' : 'border-slate-400')} />
              <span>
                <span className="block text-sm font-semibold text-slate-800">{t.title}</span>
                <span className="block text-xs text-slate-500">{t.hint}</span>
              </span>
            </button>
        ))}
      </div>
      {errors.team && <p className="mt-2 text-xs text-red-600">{errors.team}</p>}

      {f.team === 'OUT' && (
        <div className="mt-4">
          <SubBox>
            <div className={grid4}>
              <Field label="Client company" required error={errors.clientCompanyId}>
                <select className={clsx('input', errors.clientCompanyId && 'border-red-400')} value={f.clientCompanyId} onChange={(e) => set('clientCompanyId', e.target.value)}>
                  <option value="">Select from client list…</option>
                  {clients.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Employed by" required>
                <select className="input" value={f.employedBy} onChange={(e) => set('employedBy', e.target.value as 'BH' | 'SA')}>
                  <option value="BH">VirtuThinko W.L.L. (Bahrain)</option>
                  <option value="SA">VirtuThinko Company (KSA)</option>
                </select>
              </Field>
              <Field label="Client site / location">
                <TextInput {...bind('clientSite')} placeholder="e.g. client HQ, Manama" maxLength={100} />
              </Field>
              <Field label="Client contract / PO reference">
                <TextInput {...bind('poNumber')} placeholder="e.g. PO-0000" maxLength={50} />
              </Field>
              <Field label="Deployment start" required error={errors.deploymentStart}>
                <TextInput type="date" {...bind('deploymentStart')} />
              </Field>
              <Field label="Deployment end" hint="Leave empty if open-ended" error={errors.deploymentEnd}>
                <TextInput type="date" {...bind('deploymentEnd')} />
              </Field>
              <Field label="Client-side supervisor">
                <TextInput {...bind('clientSupervisor')} placeholder="Name · email" maxLength={150} />
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Not in the list? <Link to="/settings/organization" className="font-medium text-brand-600 underline">Add a client in Settings › Organization</Link>
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">Paid through VirtuThinko payroll · billed to the client</span>
            </div>
          </SubBox>
        </div>
      )}
    </Section>
  );
}
