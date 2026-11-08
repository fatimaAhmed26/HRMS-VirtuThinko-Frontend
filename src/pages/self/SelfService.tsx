import { PageHeader } from '../../components/ui/PageHeader';
import { ServiceTile } from './ServiceTile';
import { SERVICE_GROUPS } from './services';

export default function SelfService() {
  return (
    <>
      <PageHeader title="Self-service" subtitle="Everything you can do yourself. Pick a service and it takes you there." />
      <div className="space-y-6">
        {SERVICE_GROUPS.map((g) => (
          <section key={g.label}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{g.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((s) => <ServiceTile key={s.title} s={s} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
