import type { StatChallengeFormState, SuccessKind } from '../types/statChallenge';
import { StatValueRow } from './StatSelect';
import { TotemSelect } from './TotemSelect';

type StatChallengeFormProps = {
  value: StatChallengeFormState;
  onChange: (value: StatChallengeFormState) => void;
  campaignId?: string;
};

export function StatChallengeForm({
  value,
  onChange,
  campaignId,
}: StatChallengeFormProps) {
  function patch(partial: Partial<StatChallengeFormState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="stat-challenge-form">
      <label>
        Prueba
        <StatValueRow
          stat={value.stat}
          value={value.value}
          onStatChange={(stat) => patch({ stat })}
          onValueChange={(nextValue) => patch({ value: nextValue })}
        />
      </label>

      <fieldset className="outcome-fieldset">
        <legend>Si superas (opcional)</legend>
        <p className="muted section-hint">
          Ganas algo o vas a otra localización. Déjalo vacío si solo continúas en la misma.
        </p>
        <label>
          Resultado
          <select
            value={value.successKind}
            onChange={(e) =>
              patch({ successKind: e.target.value as SuccessKind })
            }
          >
            <option value="GOTO">Ir a localización</option>
            <option value="REWARD">Ganar recompensa</option>
            <option value="TOTEM">Ganar tótem</option>
          </select>
        </label>
        {value.successKind === 'GOTO' ? (
          <label>
            Localización
            <input
              placeholder="34.2"
              value={value.successDestination}
              onChange={(e) => patch({ successDestination: e.target.value })}
            />
          </label>
        ) : value.successKind === 'TOTEM' ? (
          <label>
            Tótem
            <TotemSelect
              campaignId={campaignId}
              value={value.successTotemId}
              onChange={(successTotemId) => patch({ successTotemId })}
            />
          </label>
        ) : (
          <label>
            Recompensa
            <input
              placeholder="Ej: 2 carne, palabra clave..."
              value={value.successReward}
              onChange={(e) => patch({ successReward: e.target.value })}
            />
          </label>
        )}
      </fieldset>

      <fieldset className="outcome-fieldset">
        <legend>Si fallas</legend>
        <label>
          Consecuencias
          <textarea
            rows={3}
            placeholder="Ej: -3 salud, moral baja, veneno..."
            value={value.failureText}
            onChange={(e) => patch({ failureText: e.target.value })}
          />
        </label>
        <label>
          Ir a (opcional)
          <input
            placeholder="34.5"
            value={value.failureDestination}
            onChange={(e) => patch({ failureDestination: e.target.value })}
          />
        </label>
      </fieldset>
    </div>
  );
}

export function isStatChallengeFormValid(value: StatChallengeFormState): boolean {
  if (!value.value || Number(value.value) <= 0) return false;

  const hasSuccess =
    value.successKind === 'GOTO'
      ? Boolean(value.successDestination.trim())
      : value.successKind === 'TOTEM'
        ? Boolean(value.successTotemId)
        : Boolean(value.successReward.trim());

  const hasFailure =
    Boolean(value.failureText.trim()) || Boolean(value.failureDestination.trim());

  return hasSuccess || hasFailure;
}

export function toStatChallengePayload(value: StatChallengeFormState) {
  const hasSuccess =
    value.successKind === 'GOTO'
      ? Boolean(value.successDestination.trim())
      : value.successKind === 'TOTEM'
        ? Boolean(value.successTotemId)
        : Boolean(value.successReward.trim());

  return {
    stat: value.stat,
    value: Number(value.value),
    successKind: hasSuccess ? value.successKind : undefined,
    successReward:
      hasSuccess && value.successKind === 'REWARD'
        ? value.successReward.trim()
        : undefined,
    successTotemId:
      hasSuccess && value.successKind === 'TOTEM'
        ? value.successTotemId
        : undefined,
    successDestination:
      hasSuccess && value.successKind === 'GOTO'
        ? value.successDestination.trim()
        : undefined,
    failureText: value.failureText.trim() || undefined,
    failureDestination: value.failureDestination.trim() || undefined,
  };
}
