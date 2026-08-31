import { apiFetch } from './client';
import type { OptionPayload } from '../types/option';
import type { OutcomePayload } from '../constants/gameEffects';
import type { FailurePenalties, SuccessKind } from '../types/statChallenge';

export interface StructuredEntry {
  id: string;
  type: string;
  content: string;
  metadata: {
    keyword?: string;
    destination?: string;
    stat?: string;
    value?: number;
    reward?: string;
    totemId?: string;
    totemName?: string;
    gains?: OutcomePayload['gains'];
    losses?: OutcomePayload['losses'];
    returnToShip?: boolean;
    notes?: string;
    eventKind?: 'STAT_TEST' | 'COMBAT' | 'TEXT';
    label?: string;
    description?: string;
    successKind?: SuccessKind;
    successReward?: string;
    successTotemId?: string;
    successTotemName?: string;
    successDestination?: string;
    success?: OptionPayload['success'];
    failure?: OptionPayload['failure'];
    failureText?: string;
    failurePenalties?: FailurePenalties;
    failureDestination?: string;
  } | null;
  parentId: string | null;
  campaignId: string;
  campaignName: string;
}

export interface DiagramNode {
  id: string;
  kind: 'access' | 'mandatory' | 'option' | 'success' | 'failure' | 'reward' | 'location';
  label: string;
  detail?: string;
  destination?: string;
  returnToShip?: boolean;
  cycle?: boolean;
  children: DiagramNode[];
}

export interface StructuredKnowledge {
  access: StructuredEntry[];
  mandatory: StructuredEntry[];
  options: StructuredEntry[];
  rewards: StructuredEntry[];
  other: StructuredEntry[];
  diagram: DiagramNode[];
}

export type StatChallengePayload = {
  stat: string;
  value: number;
  successKind?: SuccessKind;
  successReward?: string;
  successTotemId?: string;
  successDestination?: string;
  failureText?: string;
  failureDestination?: string;
};

export function getStructuredKnowledge(campaignId: string, locationId: string) {
  return apiFetch<StructuredKnowledge>(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge`,
  );
}

export function markVisited(campaignId: string, locationId: string) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/visit`,
    { method: 'POST' },
  );
}

export function addAccess(
  campaignId: string,
  locationId: string,
  data: { keyword: string; destination: string },
) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/access`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export function addMandatoryEvent(
  campaignId: string,
  locationId: string,
  data: {
    eventKind: 'STAT_TEST' | 'COMBAT' | 'TEXT';
    description?: string;
  } & Partial<StatChallengePayload>,
) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/mandatory`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export function addOption(
  campaignId: string,
  locationId: string,
  data: OptionPayload & { label?: string },
) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/option`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export function addFailure(
  campaignId: string,
  locationId: string,
  data: { destination: string; parentOptionId?: string },
) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/failure`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export function addReward(
  campaignId: string,
  locationId: string,
  data: { reward: string },
) {
  return apiFetch(
    `/campaigns/${campaignId}/locations/${locationId}/knowledge/reward`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export function deleteEntry(id: string) {
  return apiFetch(`/knowledge/${id}`, { method: 'DELETE' });
}
