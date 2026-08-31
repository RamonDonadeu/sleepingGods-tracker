import { apiFetch } from './client';
import type { Location, LocationStatus } from '../types';

export type LocationSearchResult = {
  type: 'location';
  location: Location;
  campaignStatus: LocationStatus;
  visited: boolean;
  hasPriorKnowledge: boolean;
};

export type KeywordSearchResult = {
  type: 'keyword';
  query: string;
  keyword: { id: string; word: string } | null;
  locations: Array<{
    id: string;
    number: string;
    name: string | null;
    entryType: string;
    content: string;
    metadata: { keyword?: string; destination?: number } | null;
    campaignName: string;
  }>;
};

export function search(query: string, campaignId: string) {
  return apiFetch<LocationSearchResult | KeywordSearchResult | { type: 'empty' }>(
    `/search?q=${encodeURIComponent(query)}&campaignId=${campaignId}`,
  );
}
