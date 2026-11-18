// /api/onboarding-links - the link HR sends a new joiner to fill in the onboarding form, and the public page that submits it
import { api } from '../lib/api';

export interface OnboardingLinkItem {
  id: number;
  status: 'sent' | 'submitted' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  submittedAt: string | null;
  token: string | null; // only while the employee can still use the link
}

export interface OnboardingLinkDetail extends OnboardingLinkItem {
  answers: Record<string, unknown> | null;
  files: { key: string; name: string }[];
}

export const list = () => api.get<OnboardingLinkItem[]>('/onboarding-links').then((r) => r.data);
export const create = () => api.post<OnboardingLinkItem>('/onboarding-links').then((r) => r.data);
export const details = (id: number) => api.get<OnboardingLinkDetail>(`/onboarding-links/${id}`).then((r) => r.data);
export const cancel = (id: number) => api.post(`/onboarding-links/${id}/cancel`);
export const fileBlob = (id: number, key: string) =>
  api.get<Blob>(`/onboarding-links/${id}/files/${key}`, { responseType: 'blob' }).then((r) => r.data);

export const publicInfo = (token: string) =>
  api.get<{ status: string; expiresAt: string }>(`/public/onboarding/${token}`).then((r) => r.data);

// The answers go as one JSON field; each checklist upload goes under its checklist key
export function submit(token: string, answers: object, files: Partial<Record<string, File>>) {
  const body = new FormData();
  body.append('answers', JSON.stringify(answers));
  for (const [key, file] of Object.entries(files)) if (file) body.append(key, file, file.name);
  return api.post(`/public/onboarding/${token}/submit`, body);
}
