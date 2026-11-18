// Public page the employee opens from the link HR sends. No sign-in: read the document, draw a signature, confirm.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useParams } from 'react-router-dom';
import * as signaturesApi from '../../api/signatures';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">{children}</div>
  );
}

export default function SignDocument() {
  const { token = '' } = useParams();
  const qc = useQueryClient();
  const info = useQuery({ queryKey: ['public-sign', token], queryFn: () => signaturesApi.publicInfo(token), retry: false });
  const canSign = info.data?.status === 'sent';
  const pdf = useQuery({ queryKey: ['public-sign-pdf', token], queryFn: () => signaturesApi.publicDocument(token), enabled: canSign, retry: false });
  const url = useMemo(() => (pdf.data ? URL.createObjectURL(pdf.data) : null), [pdf.data]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);

  // canvas pixels, so the drawing stays right when the canvas is scaled on screen
  function point(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * canvas.width) / r.width, y: ((e.clientY - r.top) * canvas.height) / r.height };
  }
  function down(e: PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    last.current = point(e);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setHasInk(true);
  }
  function up() {
    drawing.current = false;
    last.current = null;
  }
  function clear() {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  const sign = useMutation({
    mutationFn: () => signaturesApi.publicSign(token, {
      signerName: name.trim(),
      signatureImage: canvasRef.current!.toDataURL('image/png'),
      consent,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['public-sign', token] }),
  });

  if (info.isLoading) return <Loading />;
  if (info.error || !info.data) return <Card><ErrorMessage error={info.error ?? 'This link is not valid'} /></Card>;

  const d = info.data;
  if (d.status === 'signed') {
    return (
      <Card>
        <p className="text-lg font-semibold text-slate-900">Thank you</p>
        <p className="mt-2 text-sm text-slate-600">{d.title} signed on {d.signedAt ? fmtDate(d.signedAt) : 'today'}. HR has been notified.</p>
      </Card>
    );
  }
  if (d.status !== 'sent') {
    const text = d.status === 'expired' ? 'This link has expired. Ask HR to send a new one.' : 'HR cancelled this request.';
    return <Card><p className="text-sm text-slate-700">{text}</p></Card>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-10">
      <header>
        <p className="text-xs text-slate-500">VirtuThinko HR</p>
        <h1 className="text-xl font-semibold text-slate-900">{d.title}</h1>
        <p className="text-sm text-slate-500">For {d.employeeName}. Read the document, then sign below.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {pdf.isLoading && <Loading />}
        {pdf.error && <div className="p-5"><ErrorMessage error={pdf.error} /></div>}
        {url && <iframe title="Document to sign" src={`${url}#toolbar=0`} className="h-[65vh] w-full" />}
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block"><span className="label">Full name</span>
          <input className="input" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} placeholder="As on your ID" />
        </label>

        <div>
          <span className="label">Your signature</span>
          <canvas ref={canvasRef} width={600} height={180} aria-label="Signature pad"
            className="w-full touch-none rounded-lg border border-slate-300 bg-white"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
          <button type="button" className="mt-1 text-xs text-brand-600 hover:underline" onClick={clear}>Clear</button>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1 accent-brand-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          I have read this document and agree to sign it electronically.
        </label>

        <ErrorMessage error={sign.error} />
        <div className="flex justify-end">
          <Button loading={sign.isPending} disabled={!hasInk || name.trim().length < 2 || !consent} onClick={() => sign.mutate()}>
            Sign document
          </Button>
        </div>
      </section>
    </div>
  );
}
