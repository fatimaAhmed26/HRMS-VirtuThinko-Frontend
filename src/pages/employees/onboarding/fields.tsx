// Small building blocks for the onboarding form (design screen 13)
import clsx from 'clsx';
import type { InputHTMLAttributes, ReactNode } from 'react';

// Numbered white card, one per form section; the id is the target of the section chips
export function Section({ id, number, title, badge, hint, children }: {
  id: string; number?: number; title: string; badge?: ReactNode; hint?: string; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        {number !== undefined && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">{number}</span>
        )}
        {title}
        {badge}
      </h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Label + control + hint / error underneath
export function Field({ label, required, hint, error, className, children }: {
  label: string; required?: boolean; hint?: string; error?: string; className?: string; children: ReactNode;
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="label">{label}{required && <span className="text-brand-600"> *</span>}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span>
        : hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

// Text / date / number input bound to a string value
export function TextInput({ value, onChange, invalid, className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string; onChange: (v: string) => void; invalid?: boolean;
}) {
  return (
    <input
      {...rest}
      className={clsx('input', invalid && 'border-red-400', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid || undefined}
    />
  );
}

// Inline radio buttons (gender, marital status, yes/no questions)
export function Radios<T extends string>({ name, label, required, options, value, onChange, error }: {
  name: string; label: string; required?: boolean; options: { value: T; label: string }[];
  value: T | ''; onChange: (v: T) => void; error?: string;
}) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-1">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-brand-600"> *</span>}
        {error && <span className="ml-2 text-xs font-normal text-red-600">{error}</span>}
      </span>
      <span className="flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700">
            <input type="radio" name={name} className="accent-brand-600" checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </span>
    </fieldset>
  );
}

// Grey box used for "Contact 1", "Previous employer 1" and the outsourced details
export function SubBox({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
