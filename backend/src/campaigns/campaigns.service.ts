import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, LocationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  create(dto: CreateCampaignDto) {
    const players = dto.players?.map((p) => p.trim()).filter(Boolean) ?? [];
    const startingKeywords = (dto.startingKeywords ?? [])
      .map((k) => k.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 2);

    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          name: dto.name,
          notes: dto.notes,
          players: players.length > 0 ? JSON.stringify(players) : null,
          didTutorial: dto.didTutorial ?? false,
          startingKeyword1: startingKeywords[0] ?? null,
          startingKeyword2: startingKeywords[1] ?? null,
        },
      });

      for (const word of startingKeywords) {
        await tx.keyword.upsert({
          where: { word },
          create: {
            word,
            discoveredInCampaignId: campaign.id,
          },
          update: {},
        });

        const keyword = await tx.keyword.findUnique({ where: { word } });
        if (keyword) {
          await tx.keywordUsage.create({
            data: {
              keywordId: keyword.id,
              campaignId: campaign.id,
              notes: dto.didTutorial
                ? 'Palabra inicial (tutorial)'
                : 'Palabra inicial',
            },
          });
        }
      }

      return campaign;
    });
  }

  async complete(id: string) {
    await this.findOne(id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
  }

  async getMap(campaignId: string) {
    await this.findOne(campaignId);

    const [locations, campaignLocations, knowledgeEntries] = await Promise.all([
      this.prisma.location.findMany({ orderBy: { number: 'asc' } }),
      this.prisma.campaignLocation.findMany({ where: { campaignId } }),
      this.prisma.knowledgeEntry.findMany({
        select: { locationId: true, campaignId: true },
      }),
    ]);

    const statusByLocation = new Map(
      campaignLocations.map((entry) => [entry.locationId, entry.status]),
    );

    const knowledgeByLocation = new Map<string, string[]>();
    for (const entry of knowledgeEntries) {
      const existing = knowledgeByLocation.get(entry.locationId) ?? [];
      existing.push(entry.campaignId);
      knowledgeByLocation.set(entry.locationId, existing);
    }

    const allCampaignIds = [
      ...new Set(knowledgeEntries.map((e) => e.campaignId)),
    ];
    const campaignNames = await this.prisma.campaign.findMany({
      where: { id: { in: allCampaignIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(campaignNames.map((c) => [c.id, c.name]));

    return locations.map((location) => {
      const knowledgeCampaigns = knowledgeByLocation.get(location.id) ?? [];
      const priorCampaignId = knowledgeCampaigns.find((id) => id !== campaignId);
      const hasCampaignKnowledge = knowledgeCampaigns.includes(campaignId);
      const storedStatus =
        statusByLocation.get(location.id) ?? LocationStatus.NOT_VISITED;
      const campaignStatus = hasCampaignKnowledge
        ? LocationStatus.VISITED
        : storedStatus;

      return {
        ...location,
        campaignStatus,
        hasPriorKnowledge:
          Boolean(priorCampaignId) &&
          campaignStatus === LocationStatus.NOT_VISITED,
        discoveredInCampaignName: priorCampaignId
          ? (nameById.get(priorCampaignId) ?? null)
          : null,
      };
    });
  }

  async getSummary(id: string) {
    const campaign = await this.findOne(id);
    const [locations, visits, keywords, totemStatuses] = await Promise.all([
      this.prisma.campaignLocation.findMany({
        where: { campaignId: id },
        include: { location: true },
      }),
      this.prisma.campaignVisit.findMany({
        where: { campaignId: id },
        include: { location: true },
        orderBy: { visitedAt: 'desc' },
      }),
      this.prisma.keyword.findMany({
        where: { discoveredInCampaignId: id },
        orderBy: { word: 'asc' },
      }),
      this.prisma.campaignTotemStatus.findMany({
        where: { campaignId: id, obtained: true },
        include: { totem: true },
      }),
    ]);

    return {
      campaign,
      players: campaign.players ? (JSON.parse(campaign.players) as string[]) : [],
      startingKeywords: [campaign.startingKeyword1, campaign.startingKeyword2].filter(
        Boolean,
      ) as string[],
      visitedLocations: locations.filter((l) => l.status !== 'NOT_VISITED'),
      visits,
      keywordsDiscovered: keywords,
      totemsObtained: totemStatuses.map((s) => s.totem),
    };
  }
}
