import { Construction } from 'lucide-react';
import { Card } from './Card';
import { PageHeader } from './PageHeader';

// Used by screens that are planned but not built yet. Lists the backend endpoints the screen will use.
export function PlaceholderPage({ title, subtitle, endpoints = [] }: { title: string; subtitle?: string; endpoints?: string[] }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Construction className="h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-slate-800">This screen is next on the build list.</p>
            {endpoints.length > 0 && (
              <>
                <p className="mt-2">It will use these backend endpoints:</p>
                <ul className="mt-1 list-inside list-disc font-mono text-xs text-slate-500">
                  {endpoints.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
