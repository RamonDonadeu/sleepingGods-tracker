import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.keyword.findMany({ orderBy: { word: 'asc' } });
  }

  async findOne(id: string) {
    const keyword = await this.prisma.keyword.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            campaign: { select: { id: true, name: true } },
            location: { select: { id: true, number: true, name: true } },
          },
          orderBy: { usedAt: 'desc' },
        },
      },
    });
    if (!keyword) throw new NotFoundException(`Keyword ${id} not found`);

    const discoveredCampaign = keyword.discoveredInCampaignId
      ? await this.prisma.campaign.findUnique({
          where: { id: keyword.discoveredInCampaignId },
          select: { id: true, name: true },
        })
      : null;

    const discoveredLocation = keyword.discoveredAtLocationId
      ? await this.prisma.location.findUnique({
          where: { id: keyword.discoveredAtLocationId },
          select: { id: true, number: true, name: true },
        })
      : null;

    return { ...keyword, discoveredCampaign, discoveredLocation };
  }

  create(word: string) {
    return this.prisma.keyword.upsert({
      where: { word: word.trim().toUpperCase() },
      create: { word: word.trim().toUpperCase() },
      update: {},
    });
  }

  addUsage(
    keywordId: string,
    data: { campaignId?: string; locationId?: string; notes?: string },
  ) {
    return this.prisma.keywordUsage.create({
      data: {
        keywordId,
        campaignId: data.campaignId,
        locationId: data.locationId,
        notes: data.notes,
      },
    });
  }
}
