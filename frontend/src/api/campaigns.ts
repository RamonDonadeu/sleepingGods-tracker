import { apiFetch } from './client';
import type { Campaign, CampaignSummary, MapLocation } from '../types';

export function getCampaigns() {
  return apiFetch<Campaign[]>('/campaigns');
}

export function getCampaign(id: string) {
  return apiFetch<Campaign>(`/campaigns/${id}`);
}

export function createCampaign(data: {
  name: string;
  notes?: string;
  players?: string[];
  didTutorial?: boolean;
  startingKeywords?: string[];
}) {
  return apiFetch<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function completeCampaign(id: string) {
  return apiFetch<Campaign>(`/campaigns/${id}/complete`, { method: 'POST' });
}

export function getCampaignMap(campaignId: string) {
  return apiFetch<MapLocation[]>(`/campaigns/${campaignId}/map`);
}

export function getCampaignSummary(id: string) {
  return apiFetch<CampaignSummary>(`/campaigns/${id}/summary`);
}
