import { Injectable } from '@nestjs/common';
import { LocationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { isLocationCode, normalizeLocationCode } from '../locations/location-code.js';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationsService: LocationsService,
  ) {}

  async search(query: string, campaignId: string) {
    const trimmed = query.trim();
    if (!trimmed) return { type: 'empty' as const };

    if (isLocationCode(trimmed)) {
      const code = normalizeLocationCode(trimmed);
      const location = await this.locationsService.findOrCreate({ number: code });
      const state = await this.locationsService.getCampaignState(
        location.id,
        campaignId,
      );
      return {
        type: 'location' as const,
        location: state.location,
        campaignStatus: state.campaignStatus,
        visited: state.campaignStatus !== LocationStatus.NOT_VISITED,
        hasPriorKnowledge: state.hasPriorKnowledge,
      };
    }

    const keyword = trimmed.toUpperCase();
    const [keywordRecord, accessEntries] = await Promise.all([
      this.prisma.keyword.findFirst({
        where: { word: { contains: keyword } },
      }),
      this.prisma.knowledgeEntry.findMany({
        where: {
          OR: [
            { type: 'ACCESS', content: { contains: keyword } },
            { type: 'REQUIRED_KEYWORD', content: { contains: keyword } },
            { metadata: { contains: keyword } },
          ],
        },
        include: {
          location: true,
          campaign: { select: { id: true, name: true } },
        },
        take: 20,
      }),
    ]);

    const relatedLocations = accessEntries.map((e) => ({
      id: e.location.id,
      number: e.location.number,
      name: e.location.name,
      entryType: e.type,
      content: e.content,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      campaignName: e.campaign.name,
    }));

    return {
      type: 'keyword' as const,
      query: keyword,
      keyword: keywordRecord,
      locations: relatedLocations,
    };
  }
}
