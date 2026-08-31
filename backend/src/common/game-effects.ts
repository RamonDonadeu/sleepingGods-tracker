export const GAIN_LABELS: Record<string, string> = {
  materials: 'Materiales',
  gold: 'Oro',
  xp: 'XP',
  cereals: 'Cereales',
  vegetables: 'Verduras',
  meat: 'Carne',
  artifacts: 'Artefacto',
  keyword: 'Añadir palabra',
  totem: 'Tótem',
};

export const GAIN_ICONS: Record<string, string> = {
  materials: '🪵',
  gold: '🪙',
  xp: '⭐',
  cereals: '🌾',
  vegetables: '🥬',
  meat: '🥩',
  artifacts: '🏺',
  keyword: '🔑',
  totem: '🗿',
};

export const LOSS_LABELS: Record<string, string> = {
  poison: 'Veneno',
  fatigue: 'Cansancio',
  damage: 'Daño',
  lowMorale: 'Moral baja',
  navalDamage: 'Daño naval',
  keyword: 'Quitar palabra',
};

export const LOSS_ICONS: Record<string, string> = {
  poison: '☠️',
  fatigue: '😴',
  damage: '💔',
  lowMorale: '📉',
  navalDamage: '⚓',
  keyword: '🔑',
};

export type GainItem = {
  type: string;
  amount?: number;
  text?: string;
  totemId?: string;
  totemName?: string;
};

export type LossItem = {
  type: string;
  amount?: number;
  text?: string;
};

export type OutcomeMetadata = {
  gains?: GainItem[];
  losses?: LossItem[];
  returnToShip?: boolean;
  reward?: string;
  destination?: string;
  notes?: string;
};

export type OptionBranchMetadata = OutcomeMetadata;

function formatGainItem(item: GainItem): string {
  const icon = GAIN_ICONS[item.type] ?? '✨';
  const label = GAIN_LABELS[item.type] ?? item.type;

  if (item.type === 'keyword' || item.type === 'artifacts') {
    return `${icon} ${label}${item.text ? `: ${item.text.toUpperCase()}` : ''}`;
  }
  if (item.type === 'totem') {
    return `${icon} ${item.totemName ?? label}`;
  }
  if (item.amount != null) {
    return `${icon} ${item.amount} ${label.toLowerCase()}`;
  }
  return `${icon} ${label}`;
}

function formatLossItem(item: LossItem): string {
  const icon = LOSS_ICONS[item.type] ?? '✗';
  const label = LOSS_LABELS[item.type] ?? item.type;
  if (item.type === 'keyword' && item.text) {
    return `${icon} ${label}: ${item.text.toUpperCase()}`;
  }
  if (item.amount != null) {
    return `${icon} ${item.amount} ${label.toLowerCase()}`;
  }
  return `${icon} ${label}`;
}

export function formatOutcomeSummary(meta: OutcomeMetadata | null | undefined): string {
  if (!meta) return 'Recompensa';

  if (meta.reward?.trim()) {
    return meta.reward.trim();
  }

  const parts: string[] = [];
  const gains = meta.gains ?? [];
  const keywordTexts = gains
    .filter((item) => item.type === 'keyword' && item.text)
    .map((item) => item.text!.toUpperCase());
  const totemNames = gains
    .filter((item) => item.type === 'totem')
    .map((item) => item.totemName ?? 'Tótem');
  for (const gain of gains.filter(
    (item) => item.type !== 'keyword' && item.type !== 'totem',
  )) {
    parts.push(formatGainItem(gain));
  }
  if (keywordTexts.length > 0) {
    parts.push(`🔑 ${keywordTexts.join(', ')}`);
  }
  if (totemNames.length > 0) {
    parts.push(`🗿 ${totemNames.join(', ')}`);
  }
  for (const loss of meta.losses ?? []) {
    parts.push(formatLossItem(loss));
  }
  if (meta.returnToShip) {
    parts.push('🚢 Volver al barco');
  }
  if (meta.notes?.trim()) {
    parts.push(`📝 ${meta.notes.trim()}`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Recompensa';
}

export function formatOutcomeGood(meta: OutcomeMetadata | null | undefined): string | undefined {
  if (!meta) return undefined;
  if (meta.reward?.trim()) return `🎁 ${meta.reward.trim()}`;
  const gains = meta.gains ?? [];
  const keywordTexts = gains
    .filter((item) => item.type === 'keyword' && item.text)
    .map((item) => item.text!.toUpperCase());
  const totemNames = gains
    .filter((item) => item.type === 'totem')
    .map((item) => item.totemName ?? 'Tótem');
  const parts = gains
    .filter((item) => item.type !== 'keyword' && item.type !== 'totem')
    .map(formatGainItem);
  if (keywordTexts.length > 0) {
    parts.push(`🔑 ${keywordTexts.join(', ')}`);
  }
  if (totemNames.length > 0) {
    parts.push(`🗿 ${totemNames.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function formatOutcomeBad(meta: OutcomeMetadata | null | undefined): string | undefined {
  if (!meta) return undefined;
  const losses = meta.losses ?? [];
  const keywordTexts = losses
    .filter((item) => item.type === 'keyword' && item.text)
    .map((item) => item.text!.toUpperCase());
  const parts = losses
    .filter((item) => item.type !== 'keyword')
    .map(formatLossItem);
  if (keywordTexts.length > 0) {
    parts.push(`🔑 Quitar: ${keywordTexts.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function formatBranchSummary(
  meta: OptionBranchMetadata | null | undefined,
): string {
  if (!meta) return '';

  const parts: string[] = [];
  if (meta.destination) {
    parts.push(`Ir a #${meta.destination}`);
  }

  const good = formatOutcomeGood(meta);
  const bad = formatOutcomeBad(meta);
  if (good) parts.push(good);
  if (bad) parts.push(bad);
  if (meta.returnToShip) {
    parts.push('🚢 Volver al barco');
  }
  if (meta.notes?.trim()) {
    parts.push(`📝 ${meta.notes.trim()}`);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  return formatOutcomeSummary(meta);
}

export type OutcomeInput = {
  gains?: GainItem[];
  losses?: LossItem[];
  returnToShip?: boolean;
  reward?: string;
  destination?: string;
  notes?: string;
};

export function parseOutcomeInput(data: OutcomeInput): OutcomeMetadata {
  const gains = (data.gains ?? [])
    .map((item) => ({
      type: item.type,
      amount: item.amount != null ? Number(item.amount) : undefined,
      text: item.text?.trim().toUpperCase() || undefined,
      totemId: item.totemId?.trim() || undefined,
    }))
    .filter((item) => item.type);

  const losses = (data.losses ?? [])
    .map((item) => ({
      type: item.type,
      amount: item.amount != null ? Number(item.amount) : undefined,
      text: item.text?.trim().toUpperCase() || undefined,
    }))
    .filter((item) => item.type);

  const legacyReward = data.reward?.trim();
  const returnToShip = Boolean(data.returnToShip);
  const notes = data.notes?.trim();

  if (legacyReward) {
    return { reward: legacyReward, notes: notes || undefined };
  }

  if (gains.length === 0 && losses.length === 0 && !returnToShip && !notes) {
    throw new Error('Outcome must include at least one gain, loss, return to ship, or notes.');
  }

  return {
    gains: gains.length > 0 ? gains : undefined,
    losses: losses.length > 0 ? losses : undefined,
    returnToShip: returnToShip || undefined,
    notes: notes || undefined,
  };
}
