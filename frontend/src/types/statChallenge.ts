import type { CrewSkill } from '../constants/crewSkills';

export type SuccessKind = 'REWARD' | 'GOTO' | 'TOTEM';

/** @deprecated Legacy structured penalties */
export type FailurePenalties = Partial<
  Record<'health' | 'morale' | 'venom' | 'shipDamage' | 'fatigue' | 'other', string>
>;

export type StatChallengeMetadata = {
  stat?: string;
  value?: number;
  successKind?: SuccessKind;
  successReward?: string;
  successTotemId?: string;
  successTotemName?: string;
  successDestination?: string;
  failureText?: string;
  failureDestination?: string;
  /** @deprecated */
  failurePenalties?: FailurePenalties;
};

export type StatChallengeFormState = {
  stat: CrewSkill;
  value: string;
  successKind: SuccessKind;
  successReward: string;
  successTotemId: string;
  successDestination: string;
  failureText: string;
  failureDestination: string;
};

export const EMPTY_STAT_CHALLENGE_FORM: StatChallengeFormState = {
  stat: 'STRENGTH',
  value: '',
  successKind: 'GOTO',
  successReward: '',
  successTotemId: '',
  successDestination: '',
  failureText: '',
  failureDestination: '',
};
