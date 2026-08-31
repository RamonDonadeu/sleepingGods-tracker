import { apiFetch } from './client';
import type { Totem, TotemDetail } from '../types';

export function getTotems(campaignId?: string) {
  const query = campaignId ? `?campaignId=${campaignId}` : '';
  return apiFetch<Totem[]>(`/totems${query}`);
}

export function getTotem(id: string) {
  return apiFetch<TotemDetail>(`/totems/${id}`);
}

export function createTotem(data: { name: string; notes?: string }) {
  return apiFetch<Totem>('/totems', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setTotemCampaignStatus(
  campaignId: string,
  totemId: string,
  obtained: boolean,
) {
  return apiFetch(`/campaigns/${campaignId}/totems/${totemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ obtained }),
  });
}
