import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeEntryType, LocationStatus } from '@prisma/client';
import {
  formatFailureOutcome,
  formatStatChallengeLabel,
  formatSuccessOutcome,
  parseStatChallenge,
  type ParsedStatChallenge,
  type StatChallengeInput,
} from '../common/stat-challenge.js';
import {
  formatBranchSummary,
  formatOutcomeBad,
  formatOutcomeGood,
  formatOutcomeSummary,
  parseOutcomeInput,
  type OptionBranchMetadata,
  type OutcomeInput,
  type OutcomeMetadata,
} from '../common/game-effects.js';
import { normalizeCrewSkill } from '../common/crew-skills.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type DiagramNode = {
  id: string;
  kind: 'access' | 'mandatory' | 'option' | 'success' | 'failure' | 'reward' | 'location';
  label: string;
  detail?: string;
  destination?: string;
  returnToShip?: boolean;
  cycle?: boolean;
  children: DiagramNode[];
};

export type StructuredEntry = {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  parentId: string | null;
  campaignId: string;
  campaignName: string;
};

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async getStructured(campaignId: string, locationId: string) {
    await this.syncVisitedFromContent(campaignId, locationId);
    const result = await this.getStructuredData(locationId);
    const [visitedIds, numberToId] = await Promise.all([
      this.getVisitedLocationIds(campaignId),
      this.getLocationNumberToIdMap(),
    ]);

    const diagramCache = new Map<string, DiagramNode[]>();
    const context = {
      visitedIds,
      numberToId,
      ancestors: new Set([locationId]),
      getDiagram: async (locId: string) => {
        if (!diagramCache.has(locId)) {
          const data = await this.getStructuredData(locId);
          diagramCache.set(locId, data.diagram);
        }
        return diagramCache.get(locId)!;
      },
    };

    result.diagram = await this.expandDiagram(result.diagram, context);
    return result;
  }

  private async getStructuredData(locationId: string) {
    const entries = await this.prisma.knowledgeEntry.findMany({
      where: { locationId },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });

    const map = (e: (typeof entries)[0]): StructuredEntry => ({
      id: e.id,
      type: e.type,
      content: e.content,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      parentId: e.parentId,
      campaignId: e.campaignId,
      campaignName: e.campaign.name,
    });

    const mapped = entries.map(map);
    const access = mapped.filter((e) => e.type === 'ACCESS');
    const mandatory = mapped.filter((e) => e.type === 'MANDATORY_EVENT');
    const gotoOptions = mapped.filter((e) => e.type === 'OPTION_GOTO');
    const statOptions = mapped.filter((e) => e.type === 'OPTION_STAT_TEST');
    const rewardOptions = mapped.filter((e) => e.type === 'OPTION_REWARD');
    const totemOptions = mapped.filter((e) => e.type === 'OPTION_TOTEM');
    const failures = mapped.filter((e) => e.type === 'FAILURE_LOCATION');
    const rewards = mapped.filter((e) => e.type === 'REWARD');

    const diagram = this.buildDiagram(
      access,
      mandatory,
      gotoOptions,
      statOptions,
      rewardOptions,
      totemOptions,
      failures,
      rewards,
    );

    return {
      access,
      mandatory,
      options: [...gotoOptions, ...statOptions, ...rewardOptions, ...totemOptions, ...failures],
      rewards,
      other: mapped.filter(
        (e) =>
          ![
            'ACCESS',
            'MANDATORY_EVENT',
            'OPTION_GOTO',
            'OPTION_STAT_TEST',
            'OPTION_REWARD',
            'OPTION_TOTEM',
            'FAILURE_LOCATION',
            'REWARD',
          ].includes(e.type),
      ),
      diagram,
    };
  }

  private buildDiagram(
    access: StructuredEntry[],
    mandatory: StructuredEntry[],
    gotoOptions: StructuredEntry[],
    statOptions: StructuredEntry[],
    rewardOptions: StructuredEntry[],
    totemOptions: StructuredEntry[],
    failures: StructuredEntry[],
    rewards: StructuredEntry[],
  ): DiagramNode[] {
    const nodes: DiagramNode[] = [];

    for (const entry of access) {
      const meta = entry.metadata as { keyword?: string; destination?: string };
      nodes.push({
        id: entry.id,
        kind: 'access',
        label: `Requiere ${meta.keyword ?? '?'}`,
        detail: `para ir a #${meta.destination ?? '?'}`,
        destination: meta.destination,
        children: [],
      });
    }

    for (const entry of mandatory) {
      const meta = entry.metadata as {
        eventKind?: string;
        stat?: string;
        value?: number;
        description?: string;
        successKind?: string;
        successReward?: string;
        successDestination?: string;
        failureText?: string;
        failurePenalties?: Record<string, string>;
        failureDestination?: string;
      };
      const mandatoryFailures = failures
        .filter((f) => f.parentId === entry.id)
        .map((f) => {
          const fMeta = f.metadata as { destination?: string };
          return {
            id: f.id,
            kind: 'failure' as const,
            label: 'Si fallas',
            detail: `Ir a #${fMeta.destination ?? '?'}`,
            destination: fMeta.destination,
            children: [],
          };
        });

      const challengeChildren = this.buildStatChallengeChildren(meta, entry.id);
      const children =
        challengeChildren.length > 0 ? challengeChildren : mandatoryFailures;

      if (meta.eventKind === 'STAT_TEST') {
        nodes.push({
          id: entry.id,
          kind: 'mandatory',
          label: 'Evento obligatorio',
          detail: formatStatChallengeLabel(
            meta.stat ?? 'STAT',
            meta.value ?? 0,
          ),
          destination: meta.successDestination,
          children,
        });
      } else if (meta.eventKind === 'COMBAT') {
        nodes.push({
          id: entry.id,
          kind: 'mandatory',
          label: 'Combate obligatorio',
          detail: meta.description || entry.content,
          children: mandatoryFailures,
        });
      } else {
        nodes.push({
          id: entry.id,
          kind: 'mandatory',
          label: 'Evento obligatorio',
          detail: meta.description || entry.content,
          children: mandatoryFailures,
        });
      }
    }

    for (const entry of gotoOptions) {
      const meta = entry.metadata as { destination?: string };
      nodes.push({
        id: entry.id,
        kind: 'option',
        label: 'Opción',
        detail: `Ir a #${meta.destination ?? '?'}`,
        destination: meta.destination,
        children: [],
      });
    }

    for (const entry of statOptions) {
      const meta = entry.metadata as {
        destination?: string;
        stat?: string;
        value?: number;
        successKind?: string;
        successReward?: string;
        successDestination?: string;
        failureText?: string;
        failurePenalties?: Record<string, string>;
        failureDestination?: string;
      };
      const optionFailures = failures
        .filter((f) => f.parentId === entry.id)
        .map((f) => {
          const fMeta = f.metadata as { destination?: string };
          return {
            id: f.id,
            kind: 'failure' as const,
            label: 'Si fallas',
            detail: `Ir a #${fMeta.destination ?? '?'}`,
            destination: fMeta.destination,
            children: [],
          };
        });

      const challengeChildren = this.buildStatChallengeChildren(meta, entry.id);
      const children =
        challengeChildren.length > 0 ? challengeChildren : optionFailures;
      const successDestination =
        (meta.success as OptionBranchMetadata | undefined)?.destination ??
        meta.successDestination ??
        meta.destination ??
        undefined;

      nodes.push({
        id: entry.id,
        kind: 'option',
        label: 'Opción con prueba',
        detail: formatStatChallengeLabel(meta.stat ?? 'STAT', meta.value ?? 0),
        destination: successDestination,
        children,
      });
    }

    for (const entry of rewardOptions) {
      const meta = entry.metadata as OptionBranchMetadata;
      const detail = formatBranchSummary(meta) || formatOutcomeSummary(meta);

      nodes.push({
        id: entry.id,
        kind: 'option',
        label: 'Opción',
        detail,
        destination: meta?.destination,
        returnToShip: meta?.returnToShip,
        children: [],
      });
    }

    for (const entry of totemOptions) {
      const meta = entry.metadata as { totemName?: string };
      nodes.push({
        id: entry.id,
        kind: 'reward',
        label: 'Opción',
        detail: `Ganas tótem: ${meta.totemName ?? entry.content}`,
        children: [],
      });
    }

    const orphanFailures = failures.filter(
      (f) =>
        !f.parentId ||
        ![...statOptions, ...mandatory].some((o) => o.id === f.parentId),
    );
    for (const entry of orphanFailures) {
      const meta = entry.metadata as { destination?: string };
      nodes.push({
        id: entry.id,
        kind: 'failure',
        label: 'Fallo',
        detail: `Ir a #${meta.destination ?? '?'}`,
        destination: meta.destination,
        children: [],
      });
    }

    for (const entry of rewards) {
      nodes.push({
        id: entry.id,
        kind: 'reward',
        label: 'Recompensa',
        detail: entry.content,
        children: [],
      });
    }

    return nodes;
  }

  private async getVisitedLocationIds(campaignId: string) {
    const [statusRows, contentRows] = await Promise.all([
      this.prisma.campaignLocation.findMany({
        where: {
          campaignId,
          status: { not: LocationStatus.NOT_VISITED },
        },
        select: { locationId: true },
      }),
      this.prisma.knowledgeEntry.findMany({
        where: { campaignId },
        select: { locationId: true },
        distinct: ['locationId'],
      }),
    ]);

    return new Set([
      ...statusRows.map((row) => row.locationId),
      ...contentRows.map((row) => row.locationId),
    ]);
  }

  private async getLocationNumberToIdMap() {
    const locations = await this.prisma.location.findMany({
      select: { id: true, number: true },
    });
    return new Map(locations.map((location) => [location.number, location.id]));
  }

  private async expandDiagram(
    nodes: DiagramNode[],
    context: {
      visitedIds: Set<string>;
      numberToId: Map<string, string>;
      ancestors: Set<string>;
      getDiagram: (locationId: string) => Promise<DiagramNode[]>;
    },
  ): Promise<DiagramNode[]> {
    const expanded: DiagramNode[] = [];

    for (const node of nodes) {
      const children = await this.expandDiagram(node.children, context);
      const hasChildWithSameDestination = children.some(
        (child) => child.destination === node.destination,
      );
      const subLocation =
        node.destination && !hasChildWithSameDestination
          ? await this.buildVisitedSubDiagram(
              node.destination,
              context,
              node.id,
            )
          : [];

      expanded.push({
        ...node,
        children: [...children, ...subLocation],
      });
    }

    return expanded;
  }

  private async buildVisitedSubDiagram(
    destination: string | undefined,
    context: {
      visitedIds: Set<string>;
      numberToId: Map<string, string>;
      ancestors: Set<string>;
      getDiagram: (locationId: string) => Promise<DiagramNode[]>;
    },
    parentNodeId: string,
  ): Promise<DiagramNode[]> {
    if (!destination) return [];

    const destinationId = context.numberToId.get(destination.trim());
    if (!destinationId) return [];
    if (context.ancestors.has(destinationId)) {
      return [
        {
          id: `cycle-${destinationId}-from-${parentNodeId}`,
          kind: 'location',
          label: `#${destination.trim()}`,
          detail: '↩ Ciclo (vuelve atrás en el camino)',
          destination: destination.trim(),
          cycle: true,
          children: [],
        },
      ];
    }

    const subDiagram = await context.getDiagram(destinationId);
    const isVisited = context.visitedIds.has(destinationId);
    if (!isVisited && subDiagram.length === 0) return [];

    const nextAncestors = new Set(context.ancestors);
    nextAncestors.add(destinationId);
    const expandedSubDiagram = await this.expandDiagram(subDiagram, {
      ...context,
      ancestors: nextAncestors,
    });

    const detail = isVisited
      ? expandedSubDiagram.length > 0
        ? 'Localización visitada'
        : 'Visitada · sin caminos registrados'
      : expandedSubDiagram.length > 0
        ? 'Caminos registrados'
        : undefined;

    if (!detail) return [];

    return [
      {
        id: `location-${destinationId}-from-${parentNodeId}`,
        kind: 'location',
        label: `#${destination.trim()}`,
        detail,
        destination: destination.trim(),
        children: expandedSubDiagram,
      },
    ];
  }

  private buildBranchDiagramNode(
    branch: OptionBranchMetadata | undefined,
    entryId: string,
    suffix: string,
    label: string,
    kind: 'success' | 'failure',
  ): DiagramNode | null {
    if (!branch) return null;

    const detail = formatBranchSummary(branch);
    if (!detail) return null;

    return {
      id: `${entryId}-${suffix}`,
      kind,
      label,
      detail,
      destination: branch.destination,
      returnToShip: branch.returnToShip,
      children: [],
    };
  }

  private buildStatChallengeChildren(
    meta: Record<string, unknown>,
    entryId: string,
  ): DiagramNode[] {
    const successBranch = meta.success as OptionBranchMetadata | undefined;
    const failureBranch = meta.failure as OptionBranchMetadata | undefined;

    if (successBranch || failureBranch) {
      const children: DiagramNode[] = [];
      const successNode = this.buildBranchDiagramNode(
        successBranch,
        entryId,
        'success',
        'Si superas',
        'success',
      );
      const failureNode = this.buildBranchDiagramNode(
        failureBranch,
        entryId,
        'failure',
        'Si fallas',
        'failure',
      );
      if (successNode) children.push(successNode);
      if (failureNode) children.push(failureNode);
      return children;
    }

    const challenge = {
      stat: String(meta.stat ?? 'STAT'),
      value: Number(meta.value ?? 0),
      successKind: meta.successKind as ParsedStatChallenge['successKind'],
      successReward: meta.successReward as string | undefined,
      successTotemId: meta.successTotemId as string | undefined,
      successTotemName: meta.successTotemName as string | undefined,
      successDestination: (meta.successDestination ?? meta.destination) as
        | string
        | undefined,
      failureText: meta.failureText as string | undefined,
      failurePenalties: meta.failurePenalties as ParsedStatChallenge['failurePenalties'],
      failureDestination: meta.failureDestination as string | undefined,
    };
    const children: DiagramNode[] = [];
    const success = formatSuccessOutcome(challenge);
    const failure = formatFailureOutcome(challenge);

    if (success) {
      children.push({
        id: `${entryId}-success`,
        kind: 'success',
        label: 'Si superas',
        detail: success,
        destination: challenge.successDestination,
        children: [],
      });
    }

    if (failure) {
      children.push({
        id: `${entryId}-failure`,
        kind: 'failure',
        label: 'Si fallas',
        detail: failure,
        destination: challenge.failureDestination,
        children: [],
      });
    }

    return children;
  }

  private buildStatChallengeMetadata(challenge: ParsedStatChallenge) {
    return {
      stat: challenge.stat,
      value: challenge.value,
      successKind: challenge.successKind,
      successReward: challenge.successReward,
      successTotemId: challenge.successTotemId,
      successTotemName: challenge.successTotemName,
      successDestination: challenge.successDestination,
      destination: challenge.successDestination,
      failureText: challenge.failureText,
      failurePenalties: challenge.failurePenalties,
      failureDestination: challenge.failureDestination,
    };
  }

  private async resolveTotemForChallenge(challenge: ParsedStatChallenge) {
    if (challenge.successKind !== 'TOTEM' || !challenge.successTotemId) {
      return this.buildStatChallengeMetadata(challenge);
    }

    const totem = await this.prisma.totem.findUnique({
      where: { id: challenge.successTotemId },
    });
    if (!totem) {
      throw new BadRequestException('Totem not found.');
    }

    return {
      ...this.buildStatChallengeMetadata({
        ...challenge,
        successTotemName: totem.name,
      }),
    };
  }

  private async resolveOutcomeMetadata(data: OutcomeInput): Promise<OutcomeMetadata> {
    let outcome: OutcomeMetadata;
    try {
      outcome = parseOutcomeInput(data);
    } catch {
      throw new BadRequestException(
        'Provide at least one gain, loss, or return to ship.',
      );
    }

    if (!outcome.gains?.length) return outcome;

    const gains = [];
    for (const gain of outcome.gains) {
      if (gain.type === 'totem' && gain.totemId) {
        const totem = await this.prisma.totem.findUnique({
          where: { id: gain.totemId },
        });
        if (!totem) {
          throw new BadRequestException('Totem not found.');
        }
        gains.push({ ...gain, totemName: totem.name });
      } else {
        gains.push(gain);
      }
    }

    return { ...outcome, gains };
  }

  private async resolveOptionBranch(
    data: OutcomeInput & { destination?: string },
  ): Promise<OptionBranchMetadata | null> {
    const destination = data.destination?.trim() || undefined;
    const hasRewards =
      (data.gains?.length ?? 0) > 0 ||
      (data.losses?.length ?? 0) > 0 ||
      Boolean(data.returnToShip) ||
      Boolean(data.reward?.trim()) ||
      Boolean(data.notes?.trim());

    if (!destination && !hasRewards) {
      return null;
    }

    if (!hasRewards) {
      return { destination };
    }

    const outcome = await this.resolveOutcomeMetadata(data);
    return { ...outcome, destination };
  }

  private async ensureCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  private async ensureLocation(locationId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async markVisited(campaignId: string, locationId: string) {
    await this.ensureCampaign(campaignId);
    await this.ensureLocation(locationId);
    return this.prisma.campaignLocation.upsert({
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

  private async syncVisitedFromContent(campaignId: string, locationId: string) {
    const count = await this.prisma.knowledgeEntry.count({
      where: { campaignId, locationId },
    });
    if (count > 0) {
      await this.markVisited(campaignId, locationId);
    }
  }

  private async createEntry(
    campaignId: string,
    locationId: string,
    data: {
      type: KnowledgeEntryType;
      content: string;
      metadata?: string;
      parentId?: string | null;
    },
  ) {
    const entry = await this.prisma.knowledgeEntry.create({
      data: {
        locationId,
        campaignId,
        ...data,
      },
    });
    await this.syncVisitedFromContent(campaignId, locationId);
    return entry;
  }

  async addAccess(
    campaignId: string,
    locationId: string,
    data: { keyword: string; destination: string },
  ) {
    await this.ensureCampaign(campaignId);
    const keyword = data.keyword.trim().toUpperCase();
    const destination = data.destination.trim();
    const content = `Requiere ${keyword} para ir a #${destination}`;
    return this.createEntry(campaignId, locationId, {
      type: KnowledgeEntryType.ACCESS,
      content,
      metadata: JSON.stringify({
        keyword,
        destination,
      }),
    });
  }

  async addMandatoryEvent(
    campaignId: string,
    locationId: string,
    data: {
      eventKind: 'STAT_TEST' | 'COMBAT' | 'TEXT';
      description?: string;
    } & StatChallengeInput,
  ) {
    await this.ensureCampaign(campaignId);
    const eventKind = data.eventKind;
    const description = data.description?.trim();

    if (eventKind === 'STAT_TEST') {
      const challenge = parseStatChallenge(data);
      const content = `Prueba obligatoria: ${formatStatChallengeLabel(
        challenge.stat,
        challenge.value,
      )}`;

      return this.createEntry(campaignId, locationId, {
        type: KnowledgeEntryType.MANDATORY_EVENT,
        content,
        metadata: JSON.stringify({
          eventKind,
          ...(await this.resolveTotemForChallenge(challenge)),
        }),
      });
    }

    const content =
      eventKind === 'COMBAT'
        ? `Combate obligatorio${description ? `: ${description}` : ''}`
        : description || 'Evento obligatorio';

    return this.createEntry(campaignId, locationId, {
      type: KnowledgeEntryType.MANDATORY_EVENT,
      content,
      metadata: JSON.stringify({
        eventKind,
        description,
      }),
    });
  }

  async addOption(
    campaignId: string,
    locationId: string,
    data: {
      isStatTest?: boolean;
      stat?: string;
      value?: number;
      outcome?: OutcomeInput & { destination?: string };
      success?: OutcomeInput & { destination?: string };
      failure?: OutcomeInput & { destination?: string };
      label?: string;
    },
  ) {
    await this.ensureCampaign(campaignId);

    if (data.isStatTest) {
      const stat = normalizeCrewSkill(data.stat);
      if (!stat) {
        throw new BadRequestException(
          'Invalid crew skill. Use STRENGTH, PERCEPTION, SAVVY, CUNNING, or CRAFT.',
        );
      }

      const value = Number(data.value);
      if (!Number.isFinite(value) || value <= 0) {
        throw new BadRequestException('Challenge value must be a positive number.');
      }

      const success = data.success
        ? await this.resolveOptionBranch(data.success)
        : null;
      const failure = data.failure
        ? await this.resolveOptionBranch(data.failure)
        : null;

      if (!success && !failure) {
        throw new BadRequestException(
          'Provide at least a success or failure outcome.',
        );
      }

      const content = `Prueba: ${formatStatChallengeLabel(stat, value)}`;

      return this.createEntry(campaignId, locationId, {
        type: KnowledgeEntryType.OPTION_STAT_TEST,
        content,
        metadata: JSON.stringify({
          label: data.label,
          stat,
          value,
          success: success ?? undefined,
          failure: failure ?? undefined,
        }),
      });
    }

    const outcome = await this.resolveOptionBranch(data.outcome ?? {});
    if (!outcome) {
      throw new BadRequestException(
        'Option must include a destination, rewards, or return to ship.',
      );
    }

    const hasRewards =
      Boolean(outcome.gains?.length) ||
      Boolean(outcome.losses?.length) ||
      Boolean(outcome.returnToShip) ||
      Boolean(outcome.reward?.trim());

    const entryType = hasRewards
      ? KnowledgeEntryType.OPTION_REWARD
      : KnowledgeEntryType.OPTION_GOTO;

    const content =
      entryType === KnowledgeEntryType.OPTION_GOTO
        ? `Ir a #${outcome.destination}`
        : formatBranchSummary(outcome) || formatOutcomeSummary(outcome);

    return this.createEntry(campaignId, locationId, {
      type: entryType,
      content,
      metadata: JSON.stringify({
        ...outcome,
        label: data.label,
      }),
    });
  }

  async addFailure(
    campaignId: string,
    locationId: string,
    data: { destination: string; parentOptionId?: string },
  ) {
    await this.ensureCampaign(campaignId);
    const destination = data.destination.trim();
    return this.createEntry(campaignId, locationId, {
      parentId: data.parentOptionId,
      type: KnowledgeEntryType.FAILURE_LOCATION,
      content: `Fallo → #${destination}`,
      metadata: JSON.stringify({ destination }),
    });
  }

  async addReward(
    campaignId: string,
    locationId: string,
    data: { reward: string },
  ) {
    await this.ensureCampaign(campaignId);
    return this.createEntry(campaignId, locationId, {
      type: KnowledgeEntryType.REWARD,
      content: data.reward.trim(),
    });
  }

  async deleteEntry(id: string) {
    return this.prisma.knowledgeEntry.delete({ where: { id } });
  }
}
