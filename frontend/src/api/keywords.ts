import { apiFetch } from './client';
import type { Keyword, KeywordDetail } from '../types';

export function getKeywords() {
  return apiFetch<Keyword[]>('/keywords');
}

export function getKeyword(id: string) {
  return apiFetch<KeywordDetail>(`/keywords/${id}`);
}

export function createKeyword(word: string) {
  return apiFetch<Keyword>('/keywords', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}

export function addKeywordUsage(
  id: string,
  data: { campaignId?: string; locationId?: string; notes?: string },
) {
  return apiFetch(`/keywords/${id}/usages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
