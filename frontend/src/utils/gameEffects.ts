import {
  GAIN_ICONS,
  GAIN_LABELS,
  LOSS_ICONS,
  LOSS_LABELS,
  type GainItem,
  type LossItem,
  type OutcomePayload,
} from '../constants/gameEffects';

export type OutcomeMetadata = OutcomePayload & {
  reward?: string;
  totemId?: string;
  totemName?: string;
  destination?: string;
};

function formatGainItem(item: GainItem): string {
  const icon = GAIN_ICONS[item.type as keyof typeof GAIN_ICONS] ?? '✨';
  const label = GAIN_LABELS[item.type as keyof typeof GAIN_LABELS] ?? item.type;

  if (item.type === 'keyword' || item.type === 'artifacts') {
    return `${icon} ${label}${item.text ? `: ${item.text}` : ''}`;
  }
  if (item.type === 'totem') {
    return `${icon} ${item.totemName ?? 'Tótem'}`;
  }
  if (item.amount != null) {
    return `${icon} ${item.amount} ${label.toLowerCase()}`;
  }
  return `${icon} ${label}`;
}

function formatLossItem(item: LossItem): string {
  const icon = LOSS_ICONS[item.type as keyof typeof LOSS_ICONS] ?? '✗';
  const label = LOSS_LABELS[item.type as keyof typeof LOSS_LABELS] ?? item.type;
  if (item.type === 'keyword' && item.text) {
    return `${icon} ${label}: ${item.text}`;
  }
  if (item.amount != null) {
    return `${icon} ${item.amount} ${label.toLowerCase()}`;
  }
  return `${icon} ${label}`;
}

export function formatBranchEntry(
  meta: OutcomeMetadata | null | undefined,
): string {
  if (!meta) return '';

  if (meta.reward?.trim()) {
    return `🎁 ${meta.reward.trim()}`;
  }

  if (meta.totemName) {
    return `🗿 ${meta.totemName}`;
  }

  const parts: string[] = [];
  if (meta.destination) {
    parts.push(`→ #${meta.destination}`);
  }

  const gains = meta.gains ?? [];
  const gainKeywords = gains
    .filter((item) => item.type === 'keyword' && item.text)
    .map((item) => item.text!.toUpperCase());
  const gainTotems = gains
    .filter((item) => item.type === 'totem')
    .map((item) => item.totemName ?? 'Tótem');
  const good = gains
    .filter((item) => item.type !== 'keyword' && item.type !== 'totem')
    .map(formatGainItem);
  if (gainKeywords.length > 0) {
    good.push(`🔑 ${gainKeywords.join(', ')}`);
  }
  if (gainTotems.length > 0) {
    good.push(`🗿 ${gainTotems.join(', ')}`);
  }

  const losses = meta.losses ?? [];
  const lossKeywords = losses
    .filter((item) => item.type === 'keyword' && item.text)
    .map((item) => item.text!.toUpperCase());
  const bad = losses
    .filter((item) => item.type !== 'keyword')
    .map(formatLossItem);
  if (lossKeywords.length > 0) {
    bad.push(`🔑 Quitar: ${lossKeywords.join(', ')}`);
  }

  if (good.length > 0) parts.push(good.join(' · '));
  if (bad.length > 0) parts.push(bad.join(' · '));
  if (meta.returnToShip) parts.push('🚢 Barco');
  if (meta.notes?.trim()) parts.push(`📝 ${meta.notes.trim()}`);

  return parts.join(' · ');
}

export function formatOutcomeEntry(meta: OutcomeMetadata | null | undefined): string {
  const summary = formatBranchEntry(meta);
  return summary || '🎁 Recompensa';
}
