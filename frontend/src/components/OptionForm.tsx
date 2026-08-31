import type { OptionFormState } from '../types/option';
import { StatValueRow } from './StatSelect';
import { OptionOutcomeSection } from './OptionOutcomeSection';

type OptionFormProps = {
  campaignId?: string;
  value: OptionFormState;
  onChange: (value: OptionFormState) => void;
};

export function OptionForm({ campaignId, value, onChange }: OptionFormProps) {
  function patch(partial: Partial<OptionFormState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="option-form">
      <label className="checkbox-label checkbox-label-compact">
        <input
          type="checkbox"
          checked={value.isStatTest}
          onChange={(e) => patch({ isStatTest: e.target.checked })}
        />
        ¿Es una prueba?
      </label>

      {value.isStatTest ? (
        <>
          <label>
            Prueba
            <StatValueRow
              stat={value.stat}
              value={value.value}
              onStatChange={(stat) => patch({ stat })}
              onValueChange={(nextValue) => patch({ value: nextValue })}
            />
          </label>
          <OptionOutcomeSection
            title="Si superas"
            campaignId={campaignId}
            value={value.success}
            onChange={(success) => patch({ success })}
            collapseRewards
          />
          <OptionOutcomeSection
            title="Si fallas"
            campaignId={campaignId}
            value={value.failure}
            onChange={(failure) => patch({ failure })}
            collapseRewards
          />
        </>
      ) : (
        <OptionOutcomeSection
          title="Resultado"
          campaignId={campaignId}
          value={value.outcome}
          onChange={(outcome) => patch({ outcome })}
        />
      )}
    </div>
  );
}
