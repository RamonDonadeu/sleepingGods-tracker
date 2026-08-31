import { apiFetch } from './client';
import type { CampaignVisit, LocationStatus, VisitOption } from '../types';

export interface RegisterVisitPayload {
  status?: LocationStatus;
  requiredKeyword?: string;
  notes?: string;
  options?: VisitOption[];
  keywordsDiscovered?: string[];
  totemsFound?: string[];
  resources?: string[];
  combats?: string[];
}

export function registerVisit(
  campaignId: string,
  locationId: string,
  data: RegisterVisitPayload,
) {
  return apiFetch<CampaignVisit>(
    `/campaigns/${campaignId}/locations/${locationId}/visits`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}
