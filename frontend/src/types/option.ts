import type { OutcomePayload } from '../constants/gameEffects';
import type { CrewSkill } from '../constants/crewSkills';

import {
  EMPTY_REWARD_FORM,
  isRewardFormValid,
  toRewardPayload,
  type RewardFormState,
} from '../components/RewardForm';

export type OutcomeFormState = {
  destination: string;
  rewards: RewardFormState;
};

export const EMPTY_OUTCOME_FORM: OutcomeFormState = {
  destination: '',
  rewards: EMPTY_REWARD_FORM,
};

export type OptionFormState = {
  isStatTest: boolean;
  stat: CrewSkill;
  value: string;
  outcome: OutcomeFormState;
  success: OutcomeFormState;
  failure: OutcomeFormState;
};

export const EMPTY_OPTION_FORM: OptionFormState = {
  isStatTest: false,
  stat: 'STRENGTH',
  value: '',
  outcome: EMPTY_OUTCOME_FORM,
  success: EMPTY_OUTCOME_FORM,
  failure: EMPTY_OUTCOME_FORM,
};

export type OptionBranchPayload = OutcomePayload & {
  destination?: string;
};

export type OptionPayload = {
  isStatTest: boolean;
  stat?: string;
  value?: number;
  outcome?: OptionBranchPayload;
  success?: OptionBranchPayload;
  failure?: OptionBranchPayload;
};

export function isOutcomeFormValid(outcome: OutcomeFormState): boolean {
  const hasDestination = Boolean(outcome.destination.trim());
  const hasRewards = isRewardFormValid(outcome.rewards);
  return hasDestination || hasRewards;
}

export function isOptionFormValid(value: OptionFormState): boolean {
  if (!value.isStatTest) {
    return isOutcomeFormValid(value.outcome);
  }

  if (!value.value || Number(value.value) <= 0) return false;
  return isOutcomeFormValid(value.success) || isOutcomeFormValid(value.failure);
}

function toBranchPayload(outcome: OutcomeFormState): OptionBranchPayload {
  const destination = outcome.destination.trim() || undefined;
  const rewards = toRewardPayload(outcome.rewards);
  return {
    destination,
    ...rewards,
  };
}

export function toOptionPayload(value: OptionFormState): OptionPayload {
  if (!value.isStatTest) {
    return {
      isStatTest: false,
      outcome: toBranchPayload(value.outcome),
    };
  }

  return {
    isStatTest: true,
    stat: value.stat,
    value: Number(value.value),
    success: toBranchPayload(value.success),
    failure: toBranchPayload(value.failure),
  };
}
