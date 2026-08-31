import { BadRequestException } from '@nestjs/common';
import { normalizeCrewSkill } from './crew-skills.js';

export type SuccessKind = 'REWARD' | 'GOTO' | 'TOTEM';

export type FailurePenalties = Partial<
  Record<'health' | 'morale' | 'venom' | 'shipDamage' | 'fatigue' | 'other', string>
>;

export type StatChallengeInput = {
  stat?: string;
  value?: number | string;
  successKind?: SuccessKind;
  successReward?: string;
  successTotemId?: string;
  successDestination?: string;
  failureText?: string;
  failurePenalties?: FailurePenalties;
  failureDestination?: string;
};

export type ParsedStatChallenge = {
  stat: string;
  value: number;
  successKind?: SuccessKind;
  successReward?: string;
  successTotemId?: string;
  successTotemName?: string;
  successDestination?: string;
  failureText?: string;
  failurePenalties?: FailurePenalties;
  failureDestination?: string;
};

export function parseStatChallenge(data: StatChallengeInput): ParsedStatChallenge {
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

  const successKind = data.successKind;
  const successReward = data.successReward?.trim();
  const successTotemId = data.successTotemId?.trim();
  const successDestination = data.successDestination?.trim();
  const failureText = data.failureText?.trim();
  const failureDestination = data.failureDestination?.trim();

  const hasSuccess =
    (successKind === 'REWARD' && Boolean(successReward)) ||
    (successKind === 'TOTEM' && Boolean(successTotemId)) ||
    (successKind === 'GOTO' && Boolean(successDestination));
  const hasFailureOutcome = Boolean(failureText) || Boolean(failureDestination);

  if (!hasSuccess && !hasFailureOutcome) {
    throw new BadRequestException(
      'Provide at least a success outcome or a failure outcome.',
    );
  }

  return {
    stat,
    value,
    successKind: hasSuccess ? successKind : undefined,
    successReward: hasSuccess && successKind === 'REWARD' ? successReward : undefined,
    successTotemId: hasSuccess && successKind === 'TOTEM' ? successTotemId : undefined,
    successDestination:
      hasSuccess && successKind === 'GOTO' ? successDestination : undefined,
    failureText,
    failureDestination,
  };
}

export function formatStatChallengeLabel(stat: string, value?: number) {
  return value ? `${stat} ${value}` : stat;
}

export function formatSuccessOutcome(challenge: ParsedStatChallenge) {
  if (challenge.successKind === 'REWARD' && challenge.successReward) {
    return `Ganas: ${challenge.successReward}`;
  }
  if (challenge.successKind === 'TOTEM' && challenge.successTotemName) {
    return `Ganas tótem: ${challenge.successTotemName}`;
  }
  if (challenge.successKind === 'TOTEM' && challenge.successTotemId) {
    return 'Ganas un tótem';
  }
  if (challenge.successKind === 'GOTO' && challenge.successDestination) {
    return `Vas a #${challenge.successDestination}`;
  }
  return undefined;
}

export function formatFailureOutcome(challenge: ParsedStatChallenge) {
  const parts: string[] = [];

  if (challenge.failureText) {
    parts.push(challenge.failureText);
  }

  if (challenge.failureDestination) {
    parts.push(`Ir a #${challenge.failureDestination}`);
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  const penalties = challenge.failurePenalties ?? {};

  if (penalties.health) parts.push(`Salud ${penalties.health}`);
  if (penalties.morale) parts.push(`Moral ${penalties.morale}`);
  if (penalties.venom) parts.push(`Veneno ${penalties.venom}`);
  if (penalties.shipDamage) parts.push(`Barco ${penalties.shipDamage}`);
  if (penalties.fatigue) parts.push(`Fatiga ${penalties.fatigue}`);
  if (penalties.other) parts.push(penalties.other);

  if (challenge.failureDestination) {
    parts.push(`Ir a #${challenge.failureDestination}`);
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}
