import { Link } from 'react-router-dom';
import type { Service } from './services';

export function ServiceTile({ s }: { s: Service }) {
  return (
    <Link to={s.to} className="block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-brand-200 hover:shadow">
      <p className="text-sm font-semibold text-slate-900">{s.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{s.hint}</p>
    </Link>
  );
}
