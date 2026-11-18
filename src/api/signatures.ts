// /api/signatures - documents HR sends to be signed, and the public page the signer uses
import { api } from '../lib/api';

export type SignatureKind = 'acceptance-letter' | 'proposal-form' | 'contract';

export interface SignatureRequest {
  id: number;
  employeeId: number;
  kind: SignatureKind;
  title: string;
  status: 'sent' | 'signed' | 'cancelled';
  token: string | null; // only while the request is still waiting for a signature
  createdAt: string;
  expiresAt: string;
  signedAt: string | null;
  signerName: string | null;
}

export interface PublicSignature {
  title: string;
  employeeName: string;
  status: 'sent' | 'signed' | 'cancelled' | 'expired';
  expiresAt: string;
  signedAt: string | null;
}

export const list = (employeeId: number) => api.get<SignatureRequest[]>('/signatures', { params: { employeeId } }).then((r) => r.data);
export const cancel = (id: number) => api.post(`/signatures/${id}/cancel`);

export const publicInfo = (token: string) => api.get<PublicSignature>(`/public/signatures/${token}`).then((r) => r.data);
export const publicDocument = (token: string) => api.get<Blob>(`/public/signatures/${token}/document`, { responseType: 'blob' }).then((r) => r.data);
export const publicSign = (token: string, body: { signerName: string; signatureImage: string; consent: boolean }) =>
  api.post(`/public/signatures/${token}/sign`, body);

// How a request looks on screen. An expired link stays "sent" on the server until someone acts on it.
export function signatureStatus(r: Pick<SignatureRequest, 'status' | 'expiresAt'>) {
  if (r.status === 'signed') return { label: 'Signed', cls: 'bg-green-50 text-green-700' };
  if (r.status === 'cancelled') return { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600' };
  if (new Date(r.expiresAt).getTime() < Date.now()) return { label: 'Link expired', cls: 'bg-red-50 text-red-700' };
  return { label: 'Waiting for signature', cls: 'bg-amber-100 text-amber-800' };
}
