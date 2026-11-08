import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useEffect } from 'react';
import * as announcementsApi from '../api/announcements';
import { fmtDate } from '../lib/format';
import type { Announcement } from '../types';
import { Button } from './ui/Button';

const priorityStyle: Record<Announcement['priority'], string> = {
  normal: 'bg-slate-100 text-slate-600',
  important: 'bg-amber-50 text-amber-700',
  urgent: 'bg-brand-50 text-brand-700',
};

// An image attachment is shown as the banner; any other file is a document to download
export function AnnouncementCard({ a, compact = false }: { a: Announcement; compact?: boolean }) {
  const isImage = a.hasAttachment && !!a.attachmentMime?.startsWith('image/');
  const { data: imageUrl } = useQuery({
    queryKey: ['announcement-image', a.id],
    queryFn: () => announcementsApi.attachmentUrl(a.id),
    enabled: isImage,
    staleTime: Infinity,
  });
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex h-36 items-end bg-gradient-to-r from-brand-700 to-brand-500 p-5">
        {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        {imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
        <div className="relative text-white">
          {compact && <p className="text-xs uppercase tracking-wide text-white/75">Latest announcement</p>}
          <h3 className="text-xl font-semibold">{a.title}</h3>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="whitespace-pre-line text-sm text-slate-700">{compact && a.body.length > 220 ? a.body.slice(0, 220) + '…' : a.body}</p>
          {a.priority !== 'normal' && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityStyle[a.priority]}`}>{a.priority}</span>}
        </div>
        {a.hasAttachment && !isImage && (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <span className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-brand-600" />{a.attachmentName}</span>
            <Button variant="secondary" className="px-3 py-1" onClick={() => announcementsApi.downloadAttachment(a)}><Download className="h-4 w-4" /> Download</Button>
          </div>
        )}
        <p className="text-xs text-slate-500">Posted {fmtDate(a.publishAt)} · HR</p>
      </div>
    </article>
  );
}
