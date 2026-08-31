import type { OutcomeFormState } from '../types/option';
import { RewardForm } from './RewardForm';

type OptionOutcomeSectionProps = {
  title: string;
  value: OutcomeFormState;
  onChange: (value: OutcomeFormState) => void;
  campaignId?: string;
  collapseRewards?: boolean;
};

export function OptionOutcomeSection({
  title,
  value,
  onChange,
  campaignId,
  collapseRewards = false,
}: OptionOutcomeSectionProps) {
  const rewardForm = (
    <RewardForm
      campaignId={campaignId}
      value={value.rewards}
      onChange={(rewards) => onChange({ ...value, rewards })}
      showReturnToShip
    />
  );

  return (
    <fieldset className="outcome-fieldset">
      <legend>{title}</legend>
      <label>
        Ir a localización
        <input
          placeholder="34.1"
          value={value.destination}
          onChange={(e) => onChange({ ...value, destination: e.target.value })}
        />
      </label>
      {collapseRewards ? (
        <details className="reward-collapse">
          <summary className="reward-collapse-summary">Recompensas y penalizaciones</summary>
          <div className="reward-collapse-content">{rewardForm}</div>
        </details>
      ) : (
        rewardForm
      )}
    </fieldset>
  );
}
