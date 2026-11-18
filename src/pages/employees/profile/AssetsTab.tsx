// Profile tab "Assets" (design screen 9): company items this employee holds, with assign and mark-returned
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import * as assetsApi from '../../../api/assets';
import type { Condition, NewAssetInput } from '../../../api/assets';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { Modal } from '../../../components/ui/Modal';
import { fmtDate } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { AssetCategory, Employee } from '../../../types';
import { Panel } from './ui';

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  laptop: 'Laptop', phone: 'Phone', monitor: 'Monitor', access_card: 'Access card', car: 'Car', other: 'Other',
};
const CONDITIONS: Condition[] = ['good', 'fair', 'damaged'];

function AssignDialog({ emp, open, onClose }: { emp: Employee; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'stock' | 'new'>('stock');
  const [assetId, setAssetId] = useState('');
  const [category, setCategory] = useState<AssetCategory>('laptop');
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [error, setError] = useState<string | null>(null);

  const stock = useQuery({ queryKey: ['assets', 'stock'], queryFn: assetsApi.stock, enabled: open });
  const available = (stock.data ?? []).filter((a) => a.country === emp.country);

  const save = useMutation({
    mutationFn: async () => {
      let id = Number(assetId);
      if (mode === 'new') {
        const input: NewAssetInput = { category, name: name.trim(), serial: serial.trim() || undefined, country: emp.country };
        id = (await assetsApi.create(input)).id;
      }
      await assetsApi.assign(id, emp.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      setAssetId(''); setName(''); setSerial(''); setError(null);
      onClose();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'stock' && !assetId) return setError('Choose an item from stock');
    if (mode === 'new' && !name.trim()) return setError('Give the new item a name');
    setError(null);
    save.mutate();
  }

  return (
    <Modal title={`Assign an item to ${emp.firstName}`} open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block"><span className="label">Source</span>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value as 'stock' | 'new')}>
            <option value="stock">From stock</option>
            <option value="new">New item</option>
          </select>
        </label>

        {mode === 'stock' ? (
          available.length ? (
            <label className="block"><span className="label">Item</span>
              <select className="input" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">Choose an item</option>
                {available.map((a) => <option key={a.id} value={a.id}>{a.tag} · {a.name}</option>)}
              </select>
            </label>
          ) : (
            <p className="text-sm text-slate-500">Nothing in stock for {emp.country === 'SA' ? 'KSA' : 'Bahrain'}. Add a new item instead.</p>
          )
        ) : (
          <>
            <label className="block"><span className="label">Category</span>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                {(Object.keys(CATEGORY_LABEL) as AssetCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </label>
            <label className="block"><span className="label">Name</span>
              <input className="input" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dell Latitude 5440 · 16 GB" />
            </label>
            <label className="block"><span className="label">Serial number (optional)</span>
              <input className="input" value={serial} maxLength={100} onChange={(e) => setSerial(e.target.value)} />
            </label>
          </>
        )}

        <ErrorMessage error={error || save.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Assign</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AssetsTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [assigning, setAssigning] = useState(false);
  const [returnCondition, setReturnCondition] = useState<Record<number, Condition>>({});
  const items = useQuery({ queryKey: ['assets', 'employee', emp.id], queryFn: () => assetsApi.forEmployee(emp.id) });

  const giveBack = useMutation({
    mutationFn: (p: { id: number; condition: Condition }) => assetsApi.giveBack(p.id, p.condition),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });

  const rows = items.data ?? [];
  const withEmployee = rows.filter((r) => !r.returnedAt).length;
  const returned = rows.length - withEmployee;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="With the employee"><p className="text-2xl font-semibold text-slate-900">{withEmployee}</p></Panel>
        <Panel title="Returned to the company"><p className="text-2xl font-semibold text-slate-900">{returned}</p></Panel>
      </div>

      <Panel
        title="Assets"
        action={can(P.assetManage) && <Button variant="secondary" onClick={() => setAssigning(true)}>Assign item</Button>}
      >
        <ErrorMessage error={items.error || giveBack.error} />
        {items.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !rows.length ? (
          <p className="text-sm text-slate-500">No company items assigned.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Item</th><th>Tag</th><th>Serial</th><th>Assigned</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.asset.name}<span className="block text-xs text-slate-400">{CATEGORY_LABEL[r.asset.category]}</span></td>
                    <td className="font-mono text-xs">{r.asset.tag}</td>
                    <td>{r.asset.serial ?? '—'}</td>
                    <td>{fmtDate(r.assignedAt)}</td>
                    <td>
                      {r.returnedAt ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Returned {fmtDate(r.returnedAt)}{r.returnCondition ? ` · ${r.returnCondition}` : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">With employee</span>
                      )}
                    </td>
                    <td className="text-right">
                      {!r.returnedAt && can(P.assetManage) && (
                        <span className="inline-flex items-center gap-2">
                          <select className="input w-auto py-1 text-xs" aria-label="Condition when returned" value={returnCondition[r.id] ?? 'good'}
                            onChange={(e) => setReturnCondition((m) => ({ ...m, [r.id]: e.target.value as Condition }))}>
                            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <Button variant="secondary" loading={giveBack.isPending && giveBack.variables?.id === r.id}
                            onClick={() => giveBack.mutate({ id: r.id, condition: returnCondition[r.id] ?? 'good' })}>
                            Mark returned
                          </Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AssignDialog emp={emp} open={assigning} onClose={() => setAssigning(false)} />
    </div>
  );
}
