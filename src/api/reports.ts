// /api/reports - view as a table (json) or export to Excel / PDF
import { api, downloadFile } from '../lib/api';

export interface ReportInfo {
  key: string;
  title: string;
  description: string;
  canExport: boolean;
}

export interface ReportResult {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  [extra: string]: unknown;
}

export const list = () => api.get<ReportInfo[]>('/reports').then((r) => r.data);
export const run = (key: string, filters: Record<string, string | undefined> = {}) =>
  api.get<ReportResult>(`/reports/${key}`, { params: { ...filters, format: 'json' } }).then((r) => r.data);
export function exportReport(key: string, format: 'xlsx' | 'pdf', filters: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams({ format });
  Object.entries(filters).forEach(([k, v]) => v && query.set(k, v));
  return downloadFile(`/reports/${key}?${query}`, `${key}.${format}`);
}
