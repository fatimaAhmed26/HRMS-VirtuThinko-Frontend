import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { Download, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import * as announcementsApi from '../../api/announcements';
import * as employeesApi from '../../api/employees';
import * as organizationApi from '../../api/organization';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDateTime, humanize } from '../../lib/format';
import type { AnnouncementAdmin } from '../../types';

type Priority = AnnouncementAdmin['priority'];
type Audience = AnnouncementAdmin['audience'];

interface FormState {
  title: string;
  body: string;
  priority: Priority;
  pinned: boolean;
  audience: Audience;
  departmentIds: number[];
  employeeIds: number[];
  publishAt: string; // local date and time from the input; empty = publish now
  expiresAt: string; // empty = no end date
}

const EMPTY_FORM: FormState = {
  title: '', body: '', priority: 'normal', pinned: false, audience: 'all', departmentIds: [], employeeIds: [], publishAt: '', expiresAt: '',
};

const AUDIENCE_TEXT: Record<Audience, string> = { all: 'Everyone', departments: 'Chosen departments', employees: 'Chosen people' };

const STATE_STYLE: Record<AnnouncementAdmin['state'], { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'bg-green-50 text-green-700 ring-green-600/20' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  expired: { label: 'Expired', cls: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
};

const toLocalInput = (iso: string | null) => (iso ? dayjs(iso).format('YYYY-MM-DDTHH:mm') : '');
const toggleId = (ids: number[], id: number) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

function audienceText(a: AnnouncementAdmin) {
  if (a.audience === 'all') return 'Everyone';
  if (a.audience === 'departments') return `${a.departmentIds.length} department(s)`;
  return `${a.employeeIds.length} person(s)`;
}

function validate(f: FormState): string | null {
  if (!f.title.trim()) return 'Give the announcement a title';
  if (!f.body.trim()) return 'Write the announcement text';
  if (f.audience === 'departments' && f.departmentIds.length === 0) return 'Choose at least one department';
  if (f.audience === 'employees' && f.employeeIds.length === 0) return 'Choose at least one person';
  if (f.publishAt && f.expiresAt && new Date(f.expiresAt) <= new Date(f.publishAt)) return 'The end date must be after the start date';
  return null;
}

// On update an empty end date is sent as null, which clears it. On create it is left out.
function toPayload(f: FormState, editing: boolean): announcementsApi.AnnouncementInput {
  return {
    title: f.title.trim(),
    body: f.body.trim(),
    priority: f.priority,
    pinned: f.pinned,
    audience: f.audience,
    departmentIds: f.audience === 'departments' ? f.departmentIds : undefined,
    employeeIds: f.audience === 'employees' ? f.employeeIds : undefined,
    publishAt: f.publishAt ? new Date(f.publishAt).toISOString() : undefined,
    expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : editing ? null : undefined,
  };
}

// HR announcements (design p.72): write a notice, choose who sees it and when, and attach a banner or PDF
export default function Announcements() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AnnouncementAdmin | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachTo, setAttachTo] = useState<number | null>(null);

  const { data: items = [], isLoading, error } = useQuery({ queryKey: ['announcements', 'admin'], queryFn: announcementsApi.listAll });
  const { data: departments = [] } = useQuery({
    queryKey: ['organization', 'departments'],
    queryFn: organizationApi.departments,
    enabled: showForm && form.audience === 'departments',
  });
  const { data: staffPage } = useQuery({
    queryKey: ['employees', 'audience'],
    queryFn: () => employeesApi.list({ status: 'active', pageSize: 100 }),
    enabled: showForm && form.audience === 'employees',
  });
  const people = (staffPage?.items ?? []).filter((e) => e.employmentType !== 'Intern'); // interns have no portal login

  const refresh = () => qc.invalidateQueries({ queryKey: ['announcements'] });

  const save = useMutation({
    mutationFn: (payload: announcementsApi.AnnouncementInput) =>
      editing ? announcementsApi.update(editing.id, payload) : announcementsApi.create(payload),
    onSuccess: () => {
      closeForm();
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: (id: number) => announcementsApi.remove(id), onSuccess: refresh });
  const attach = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => announcementsApi.attach(id, file),
    onSuccess: refresh,
  });

  function set(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(a: AnnouncementAdmin) {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      priority: a.priority,
      pinned: a.pinned,
      audience: a.audience,
      departmentIds: a.departmentIds,
      employeeIds: a.employeeIds,
      publishAt: toLocalInput(a.publishAt),
      expiresAt: toLocalInput(a.expiresAt),
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    save.reset();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate(form);
    setFormError(problem);
    if (!problem) save.mutate(toPayload(form, !!editing));
  }

  function onDelete(a: AnnouncementAdmin) {
    if (window.confirm(`Delete "${a.title}"? Employees will no longer see it.`)) remove.mutate(a.id);
  }

  function pickAttachment(id: number) {
    setAttachTo(id);
    fileRef.current?.click();
  }

  function onFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so the same file can be picked again
    if (file && attachTo !== null) attach.mutate({ id: attachTo, file });
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Notices from HR. Employees see them on their home page. Choose who sees each one and when it starts and ends."
        actions={!showForm && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        )}
      />

      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={onFilePicked} />
      <ErrorMessage error={remove.error ?? attach.error} />

      {showForm && (
        <Card title={editing ? `Edit "${editing.title}"` : 'New announcement'} className="mb-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="ann-title">Title</label>
              <input id="ann-title" className="input" maxLength={150} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="ann-body">Message</label>
              <textarea id="ann-body" className="input min-h-32" maxLength={10000} value={form.body} onChange={(e) => set({ body: e.target.value })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="ann-priority">Priority</label>
                <select id="ann-priority" className="input" value={form.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="ann-from">Show from</label>
                <input id="ann-from" type="datetime-local" className="input" value={form.publishAt} onChange={(e) => set({ publishAt: e.target.value })} />
                <p className="mt-1 text-xs text-slate-500">Empty = publish now</p>
              </div>
              <div>
                <label className="label" htmlFor="ann-until">Show until</label>
                <input id="ann-until" type="datetime-local" className="input" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
                <p className="mt-1 text-xs text-slate-500">Empty = no end date</p>
              </div>
            </div>

            <fieldset>
              <legend className="label">Who sees it</legend>
              <div className="flex flex-wrap gap-5 text-sm">
                {(Object.keys(AUDIENCE_TEXT) as Audience[]).map((value) => (
                  <label key={value} className="flex items-center gap-2">
                    <input type="radio" name="audience" checked={form.audience === value} onChange={() => set({ audience: value })} />
                    {AUDIENCE_TEXT[value]}
                  </label>
                ))}
              </div>

              {form.audience === 'departments' && (
                <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.departmentIds.includes(d.id)} onChange={() => set({ departmentIds: toggleId(form.departmentIds, d.id) })} />
                      {d.name}
                    </label>
                  ))}
                </div>
              )}

              {form.audience === 'employees' && (
                <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                  {people.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.employeeIds.includes(e.id)} onChange={() => set({ employeeIds: toggleId(form.employeeIds, e.id) })} />
                      {e.firstName} {e.lastName} <span className="text-xs text-slate-400">{e.employeeCode}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.pinned} onChange={(e) => set({ pinned: e.target.checked })} />
              Pin to the top
            </label>

            <ErrorMessage error={formError ?? save.error} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">A banner image or PDF can be attached from the list once the announcement is saved.</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                <Button type="submit" loading={save.isPending}>{editing ? 'Save changes' : 'Save announcement'}</Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All announcements (${items.length})`}>
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {!isLoading && !error && items.length === 0 && (
          <EmptyState title="No announcements yet">Write the first one with New announcement.</EmptyState>
        )}

        <ul className="divide-y divide-slate-100">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{a.title}</p>
                  <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', STATE_STYLE[a.state].cls)}>
                    {STATE_STYLE[a.state].label}
                  </span>
                  {a.priority !== 'normal' && (
                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      {humanize(a.priority)}
                    </span>
                  )}
                  {a.pinned && <span className="text-xs font-medium text-slate-500">Pinned</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {audienceText(a)} · Shows from {fmtDateTime(a.publishAt)}{a.expiresAt ? ` · until ${fmtDateTime(a.expiresAt)}` : ''}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{a.body}</p>
                {a.hasAttachment && (
                  <button type="button" onClick={() => announcementsApi.downloadAttachment(a)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                    <Download className="h-3.5 w-3.5" /> {a.attachmentName ?? 'Attachment'}
                  </button>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-1">
                <Button variant="ghost" className="px-3 py-1" onClick={() => openEdit(a)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="ghost" className="px-3 py-1" loading={attach.isPending && attachTo === a.id} onClick={() => pickAttachment(a.id)}>
                  <Paperclip className="h-4 w-4" /> {a.hasAttachment ? 'Replace file' : 'Attach file'}
                </Button>
                <Button variant="ghost" className="px-3 py-1 text-red-600 hover:bg-red-50" loading={remove.isPending && remove.variables === a.id} onClick={() => onDelete(a)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
