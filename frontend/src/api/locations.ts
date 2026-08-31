import { apiFetch } from './client';
import type { KnowledgeNode, Location, LocationCampaignState } from '../types';

export function createLocation(data: { number: string; name?: string }) {
  return apiFetch<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function findLocationByNumber(number: string) {
  return apiFetch<Location>(
    `/locations/by-number/${encodeURIComponent(number.trim())}`,
  );
}

export function getLocationState(id: string, campaignId: string) {
  return apiFetch<LocationCampaignState>(`/locations/${id}?campaignId=${campaignId}`);
}

export function getLocationKnowledge(id: string) {
  return apiFetch<KnowledgeNode[]>(`/locations/${id}/knowledge`);
}
