import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TotemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(campaignId?: string) {
    const totems = await this.prisma.totem.findMany({
      orderBy: { name: 'asc' },
    });

    if (!campaignId) return totems;

    const statuses = await this.prisma.campaignTotemStatus.findMany({
      where: { campaignId },
    });
    const statusMap = new Map(statuses.map((s) => [s.totemId, s.obtained]));

    return totems.map((totem) => ({
      ...totem,
      obtainedInCampaign: statusMap.get(totem.id) ?? false,
    }));
  }

  async findOne(id: string) {
    const totem = await this.prisma.totem.findUnique({ where: { id } });
    if (!totem) throw new NotFoundException(`Totem ${id} not found`);

    const [discoveredCampaign, discoveredLocation, campaignStatuses] =
      await Promise.all([
        totem.discoveredInCampaignId
          ? this.prisma.campaign.findUnique({
              where: { id: totem.discoveredInCampaignId },
              select: { id: true, name: true },
            })
          : null,
        totem.discoveredAtLocationId
          ? this.prisma.location.findUnique({
              where: { id: totem.discoveredAtLocationId },
              select: { id: true, number: true, name: true },
            })
          : null,
        this.prisma.campaignTotemStatus.findMany({
          where: { totemId: id },
          include: { campaign: { select: { id: true, name: true } } },
        }),
      ]);

    const allCampaigns = await this.prisma.campaign.findMany({
      orderBy: { startedAt: 'asc' },
      select: { id: true, name: true },
    });

    const obtainedMap = new Map(
      campaignStatuses.map((s) => [s.campaignId, s.obtained]),
    );

    return {
      ...totem,
      discoveredCampaign,
      discoveredLocation,
      campaignHistory: allCampaigns.map((c) => ({
        campaign: c,
        obtained: obtainedMap.get(c.id) ?? false,
      })),
    };
  }

  create(name: string, notes?: string) {
    return this.prisma.totem.upsert({
      where: { name: name.trim() },
      create: { name: name.trim(), discovered: true, notes },
      update: { notes },
    });
  }

  setCampaignStatus(campaignId: string, totemId: string, obtained: boolean) {
    return this.prisma.campaignTotemStatus.upsert({
      where: { campaignId_totemId: { campaignId, totemId } },
      create: { campaignId, totemId, obtained },
      update: { obtained },
    });
  }
}
