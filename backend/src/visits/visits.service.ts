import { Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeEntryType, LocationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterVisitDto } from './dto/register-visit.dto.js';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerVisit(
    campaignId: string,
    locationId: string,
    dto: RegisterVisitDto,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);

    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException(`Location ${locationId} not found`);

    const status = dto.status ?? LocationStatus.VISITED;
    const chosenLabels =
      dto.options?.filter((o) => o.chosen).map((o) => o.label) ?? [];

    const visit = await this.prisma.$transaction(async (tx) => {
      await tx.campaignLocation.upsert({
        where: { campaignId_locationId: { campaignId, locationId } },
        create: {
          campaignId,
          locationId,
          status,
          visitedAt: new Date(),
          notes: dto.notes,
        },
        update: {
          status,
          visitedAt: new Date(),
          notes: dto.notes,
        },
      });

      const createdVisit = await tx.campaignVisit.create({
        data: {
          campaignId,
          locationId,
          notes: dto.notes,
          choices:
            chosenLabels.length > 0 ? JSON.stringify(chosenLabels) : null,
        },
      });

      if (dto.requiredKeyword?.trim()) {
        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.REQUIRED_KEYWORD,
            content: dto.requiredKeyword.trim().toUpperCase(),
          },
        });
      }

      if (dto.notes?.trim()) {
        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.NOTE,
            content: dto.notes.trim(),
          },
        });
      }

      for (const resource of dto.resources ?? []) {
        if (!resource.trim()) continue;
        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.RESOURCE,
            content: resource.trim(),
          },
        });
      }

      for (const combat of dto.combats ?? []) {
        if (!combat.trim()) continue;
        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.COMBAT,
            content: combat.trim(),
          },
        });
      }

      for (const option of dto.options ?? []) {
        if (!option.label.trim()) continue;
        const optionEntry = await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.OPTION,
            content: option.label.trim(),
          },
        });

        for (const outcome of option.outcomes ?? []) {
          if (!outcome.trim()) continue;
          const isKeyword = outcome.startsWith('KW:');
          const isTotem = outcome.startsWith('TOTEM:');
          await tx.knowledgeEntry.create({
            data: {
              locationId,
              campaignId,
              parentId: optionEntry.id,
              type: isKeyword
                ? KnowledgeEntryType.KEYWORD_DISCOVERY
                : isTotem
                  ? KnowledgeEntryType.TOTEM
                  : KnowledgeEntryType.OUTCOME,
              content: outcome
                .replace(/^KW:/, '')
                .replace(/^TOTEM:/, '')
                .trim(),
            },
          });
        }
      }

      for (const word of dto.keywordsDiscovered ?? []) {
        const normalized = word.trim().toUpperCase();
        if (!normalized) continue;

        await tx.keyword.upsert({
          where: { word: normalized },
          create: {
            word: normalized,
            discoveredInCampaignId: campaignId,
            discoveredAtLocationId: locationId,
          },
          update: {},
        });

        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.KEYWORD_DISCOVERY,
            content: normalized,
          },
        });
      }

      for (const totemName of dto.totemsFound ?? []) {
        const name = totemName.trim();
        if (!name) continue;

        const totem = await tx.totem.upsert({
          where: { name },
          create: {
            name,
            discovered: true,
            discoveredInCampaignId: campaignId,
            discoveredAtLocationId: locationId,
          },
          update: { discovered: true },
        });

        await tx.campaignTotemStatus.upsert({
          where: {
            campaignId_totemId: { campaignId, totemId: totem.id },
          },
          create: { campaignId, totemId: totem.id, obtained: true },
          update: { obtained: true },
        });

        await tx.knowledgeEntry.create({
          data: {
            locationId,
            campaignId,
            type: KnowledgeEntryType.TOTEM,
            content: name,
          },
        });
      }

      return createdVisit;
    });

    return visit;
  }

  getVisits(campaignId: string, locationId: string) {
    return this.prisma.campaignVisit.findMany({
      where: { campaignId, locationId },
      orderBy: { visitedAt: 'desc' },
    });
  }

  async updateStatus(
    campaignId: string,
    locationId: string,
    status: LocationStatus,
  ) {
    return this.prisma.campaignLocation.upsert({
      where: { campaignId_locationId: { campaignId, locationId } },
      create: { campaignId, locationId, status },
      update: { status },
    });
  }
}
