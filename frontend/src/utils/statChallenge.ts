import type { CrewSkill } from '../constants/crewSkills';
import type { StatChallengeMetadata } from '../types/statChallenge';

const LEGACY_PENALTY_LABELS = {
  health: 'Salud',
  morale: 'Moral',
  venom: 'Veneno',
  shipDamage: 'Barco',
  fatigue: 'Fatiga',
  other: 'Otro',
} as const;

export function formatStatChallengeSummary(meta: StatChallengeMetadata | null): string {
  if (!meta?.stat) return 'Prueba de habilidad';
  const base = meta.value ? `${meta.stat} ${meta.value}` : meta.stat;
  return base;
}

export function formatSuccessOutcome(meta: StatChallengeMetadata | null): string | undefined {
  if (!meta) return undefined;
  if (meta.successKind === 'REWARD' && meta.successReward) {
    return `Superas: ganas ${meta.successReward}`;
  }
  if (meta.successKind === 'TOTEM' && meta.successTotemName) {
    return `Superas: ganas tótem ${meta.successTotemName}`;
  }
  if (meta.successKind === 'TOTEM' && meta.successTotemId) {
    return 'Superas: ganas un tótem';
  }
  if (meta.successKind === 'GOTO' && meta.successDestination) {
    return `Superas: vas a #${meta.successDestination}`;
  }
  if (meta.successReward) return `Superas: ganas ${meta.successReward}`;
  if (meta.successDestination) return `Superas: vas a #${meta.successDestination}`;
  return undefined;
}

export function formatFailureOutcome(meta: StatChallengeMetadata | null): string | undefined {
  if (!meta) return undefined;

  const parts: string[] = [];

  if (meta.failureText) {
    parts.push(meta.failureText);
  }

  if (meta.failureDestination) {
    parts.push(`vas a #${meta.failureDestination}`);
  }

  if (parts.length > 0) {
    return `Fallas: ${parts.join(' · ')}`;
  }

  const legacyParts: string[] = [];
  const penalties = meta.failurePenalties ?? {};

  for (const [key, label] of Object.entries(LEGACY_PENALTY_LABELS)) {
    const value = penalties[key as keyof typeof LEGACY_PENALTY_LABELS];
    if (value) legacyParts.push(`${label} ${value}`);
  }

  if (meta.failureDestination) {
    legacyParts.push(`vas a #${meta.failureDestination}`);
  }

  return legacyParts.length > 0 ? `Fallas: ${legacyParts.join(' · ')}` : undefined;
}

export function getStatFromMetadata(meta: StatChallengeMetadata | null): CrewSkill | undefined {
  if (!meta?.stat) return undefined;
  return meta.stat as CrewSkill;
}
