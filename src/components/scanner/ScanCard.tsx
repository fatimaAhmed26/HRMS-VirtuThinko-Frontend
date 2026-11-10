// Left side of the document scanner: choose the document type, add a photo or PDF, read it with AI
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Camera, FileText, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as scannerApi from '../../api/scanner';
import { SCAN_TYPES, scanTypeLabel, type ScanResult, type ScanType } from '../../api/scanner';
import { shrinkImage } from '../../lib/image';
import { Button } from '../ui/Button';
import { ErrorMessage } from '../ui/Feedback';

const MAX = 5 * 1024 * 1024;

export function ScanCard({ types = SCAN_TYPES.map((t) => t.value), initialType, onRead, onReset }: {
  types?: ScanType[];
  initialType?: ScanType;
  onRead: (result: ScanResult, file: File) => void;
  onReset?: () => void;
}) {
  const [type, setType] = useState<ScanType>(initialType ?? types[0]);
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<Date | null>(null);
  const status = useQuery({ queryKey: ['scanner', 'status'], queryFn: scannerApi.status, staleTime: 60_000 });

  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const read = useMutation({
    mutationFn: (f: File) => scannerApi.read(type, f),
    onSuccess: (result, f) => { setReadAt(new Date()); onRead(result, f); },
  });

  async function pick(picked: File | undefined | null) {
    setPickError(null);
    read.reset();
    if (!picked) return;
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(picked.name)) return setPickError('Use a photo (JPEG / PNG) or a PDF');
    const ready = await shrinkImage(picked);
    if (ready.size > MAX) return setPickError('The file is larger than 5 MB');
    setFile(ready);
    setReadAt(null);
  }

  function reset() {
    setFile(null);
    setReadAt(null);
    read.reset();
    onReset?.();
  }

  const notReady = status.data && !status.data.ready;

  return (
    <div className="space-y-4">
      {types.length > 1 && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Document type">
          {types.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={type === t}
              onClick={() => { setType(t); if (readAt) reset(); }}
              className={clsx('rounded-full border px-3 py-1 text-xs font-medium',
                type === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')}>
              {scanTypeLabel(t)}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">{scanTypeLabel(type)}</h3>
        <label
          className={clsx('mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-center text-xs',
            file ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-brand-400')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
        >
          {preview ? <img src={preview} alt="Document preview" className="max-h-56 w-full object-contain" />
            : file ? <span className="flex items-center gap-2 text-slate-700"><FileText className="h-5 w-5" />{file.name}</span>
            : (<><Upload className="h-6 w-6" /><span>Drop a photo or PDF here, or click to choose</span><span className="text-slate-400">Front and back on one image works best for ID cards</span></>)}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" aria-label="Choose document file" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
        </label>

        {readAt && <p className="mt-2 text-xs text-green-700">Read just now · check every field before saving</p>}
        {read.isPending && <p className="mt-2 text-xs text-slate-500">Reading the document… this can take up to 20 seconds</p>}
        <ErrorMessage error={pickError || read.error || (notReady ? 'The document scanner is not set up yet: add ANTHROPIC_API_KEY to the backend .env' : null)} />

        <div className="mt-3 flex flex-wrap gap-2">
          {!readAt && (
            <Button type="button" onClick={() => file && read.mutate(file)} disabled={!file || !!notReady} loading={read.isPending}>
              Read document
            </Button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden">
            <Camera className="h-4 w-4" /> Take photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {file && <Button type="button" variant="secondary" onClick={reset}>Scan another</Button>}
        </div>
        <p className="mt-3 text-xs text-slate-400">The image is sent to an AI service (Anthropic) only to read it, then saved here if you choose to.</p>
      </div>
    </div>
  );
}
