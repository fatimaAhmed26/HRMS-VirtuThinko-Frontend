import clsx from 'clsx';
import type { Entity } from '../../types';

export function CountryTabs({ value, onChange }: { value: Entity; onChange: (c: Entity) => void }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-slate-200">
      {(['BH', 'SA'] as const).map((c) => (
        <button key={c} onClick={() => onChange(c)}
          className={clsx('-mb-px border-b-2 px-4 py-2 text-sm font-medium', value === c ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700')}>
          {c === 'BH' ? 'Bahrain office' : 'Saudi office'}
        </button>
      ))}
    </div>
  );
}
