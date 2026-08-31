export type CampaignStatus = 'ACTIVE' | 'COMPLETED';
export type LocationStatus = 'NOT_VISITED' | 'VISITED' | 'PENDING';

export interface Campaign {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  status: CampaignStatus;
  notes: string | null;
  players: string | null;
  didTutorial: boolean;
  startingKeyword1: string | null;
  startingKeyword2: string | null;
}

export function parseCampaignPlayers(campaign: Campaign): string[] {
  if (!campaign.players) return [];
  try {
    return JSON.parse(campaign.players) as string[];
  } catch {
    return [];
  }
}

export function getStartingKeywords(campaign: Campaign): string[] {
  return [campaign.startingKeyword1, campaign.startingKeyword2].filter(
    Boolean,
  ) as string[];
}

export interface Location {
  id: string;
  number: string;
  name: string | null;
}

export interface MapLocation extends Location {
  campaignStatus: LocationStatus;
  hasPriorKnowledge: boolean;
  discoveredInCampaignName: string | null;
}

export interface CampaignVisit {
  id: string;
  campaignId: string;
  locationId: string;
  visitedAt: string;
  notes: string | null;
  choices: string | null;
}

export interface LocationCampaignState {
  location: Location;
  campaignStatus: LocationStatus;
  visits: CampaignVisit[];
  hasPriorKnowledge: boolean;
  firstDiscoveredIn: { id: string; name: string } | null;
}

export interface KnowledgeNode {
  id: string;
  type: string;
  content: string;
  campaignId: string;
  campaignName: string;
  children: KnowledgeNode[];
}

export interface Keyword {
  id: string;
  word: string;
  discoveredAt: string;
  discoveredInCampaignId: string | null;
  discoveredAtLocationId: string | null;
}

export interface KeywordDetail extends Keyword {
  discoveredCampaign: { id: string; name: string } | null;
  discoveredLocation: { id: string; number: string; name: string | null } | null;
  usages: Array<{
    id: string;
    usedAt: string;
    notes: string | null;
    campaign: { id: string; name: string } | null;
    location: { id: string; number: string; name: string | null } | null;
  }>;
}

export interface Totem {
  id: string;
  name: string;
  discovered: boolean;
  discoveredInCampaignId: string | null;
  discoveredAtLocationId: string | null;
  notes: string | null;
  obtainedInCampaign?: boolean;
}

export interface TotemDetail extends Totem {
  discoveredCampaign: { id: string; name: string } | null;
  discoveredLocation: { id: string; number: string; name: string | null } | null;
  campaignHistory: Array<{
    campaign: { id: string; name: string };
    obtained: boolean;
  }>;
}

export interface VisitOption {
  label: string;
  outcomes: string[];
  chosen: boolean;
}

export interface CampaignSummary {
  campaign: Campaign;
  players: string[];
  startingKeywords: string[];
  visitedLocations: Array<{
    status: LocationStatus;
    location: Location;
  }>;
  visits: Array<CampaignVisit & { location: Location }>;
  keywordsDiscovered: Keyword[];
  totemsObtained: Totem[];
}
