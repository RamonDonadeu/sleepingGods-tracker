import { Injectable, NotFoundException } from '@nestjs/common';
import { LocationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';

export type KnowledgeNode = {
  id: string;
  type: string;
  content: string;
  campaignId: string;
  campaignName: string;
  children: KnowledgeNode[];
};

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(dto: CreateLocationDto) {
    const number = dto.number.trim();
    return this.prisma.location.upsert({
      where: { number },
      create: { number, name: dto.name },
      update: { name: dto.name ?? undefined },
    });
  }

  async findByNumber(number: string) {
    return this.findOrCreate({ number: number.trim() });
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException(`Location ${id} not found`);
    return location;
  }

  async getCampaignState(locationId: string, campaignId: string) {
    const location = await this.findOne(locationId);
    const [campaignLocation, visits, otherCampaignKnowledge, campaignKnowledgeCount] =
      await Promise.all([
        this.prisma.campaignLocation.findUnique({
          where: { campaignId_locationId: { campaignId, locationId } },
        }),
        this.prisma.campaignVisit.findMany({
          where: { campaignId, locationId },
          orderBy: { visitedAt: 'desc' },
        }),
        this.prisma.knowledgeEntry.findFirst({
          where: { locationId, NOT: { campaignId } },
          orderBy: { id: 'asc' },
          include: { campaign: { select: { id: true, name: true } } },
        }),
        this.prisma.knowledgeEntry.count({
          where: { locationId, campaignId },
        }),
      ]);

    const hasCampaignContent = campaignKnowledgeCount > 0;
    let campaignStatus =
      campaignLocation?.status ?? LocationStatus.NOT_VISITED;

    if (hasCampaignContent) {
      campaignStatus = LocationStatus.VISITED;
      if (!campaignLocation || campaignLocation.status === LocationStatus.NOT_VISITED) {
        await this.prisma.campaignLocation.upsert({
          where: { campaignId_locationId: { campaignId, locationId } },
          create: {
            campaignId,
            locationId,
            status: LocationStatus.VISITED,
            visitedAt: new Date(),
          },
          update: {
            status: LocationStatus.VISITED,
            visitedAt: new Date(),
          },
        });
      }
    }

    return {
      location,
      campaignStatus,
      visits,
      hasPriorKnowledge:
        Boolean(otherCampaignKnowledge) &&
        campaignStatus === LocationStatus.NOT_VISITED,
      firstDiscoveredIn: otherCampaignKnowledge?.campaign ?? null,
    };
  }

  async getKnowledge(locationId: string) {
    await this.findOne(locationId);
    const entries = await this.prisma.knowledgeEntry.findMany({
      where: { locationId },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });

    const byId = new Map<string, KnowledgeNode>();
    const roots: KnowledgeNode[] = [];

    for (const entry of entries) {
      byId.set(entry.id, {
        id: entry.id,
        type: entry.type,
        content: entry.content,
        campaignId: entry.campaignId,
        campaignName: entry.campaign.name,
        children: [],
      });
    }

    for (const entry of entries) {
      const node = byId.get(entry.id)!;
      if (entry.parentId && byId.has(entry.parentId)) {
        byId.get(entry.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
