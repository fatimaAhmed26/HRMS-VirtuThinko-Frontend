import clsx from 'clsx';

// Round avatar with initials (photos come later)
export function Initials({ firstName, lastName, size = 'md' }: { firstName: string; lastName: string; size?: 'md' | 'lg' }) {
  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700',
      size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm')}>
      {(firstName[0] ?? '').toUpperCase()}{(lastName[0] ?? '').toUpperCase()}
    </span>
  );
}
