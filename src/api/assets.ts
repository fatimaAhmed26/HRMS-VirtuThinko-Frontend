// /api/assets - company items (laptops, phones, cards, cars) and who holds them
import { api } from '../lib/api';
import type { Asset, AssetAssignment, AssetCategory } from '../types';

export type Condition = 'good' | 'fair' | 'damaged';

export interface NewAssetInput {
  category: AssetCategory;
  name: string;
  serial?: string;
  condition?: Condition;
  country: 'BH' | 'SA';
  notes?: string;
}

export const stock = () => api.get<Asset[]>('/assets/stock').then((r) => r.data);
export const forEmployee = (employeeId: number) =>
  api.get<AssetAssignment[]>('/assets/assignments', { params: { employeeId } }).then((r) => r.data);
export const create = (data: NewAssetInput) => api.post<Asset>('/assets', data).then((r) => r.data);
export const assign = (assetId: number, employeeId: number) => api.post(`/assets/${assetId}/assign`, { employeeId });
export const giveBack = (assignmentId: number, condition: Condition) => api.post(`/assets/assignments/${assignmentId}/return`, { condition });
