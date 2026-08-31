import { useEffect, useState } from 'react';

import {
  GAIN_TYPES,
  LOSS_TYPES,
  type GainItem,
  type GainType,
  type LossItem,
  type LossType,
  type OutcomePayload,
} from '../constants/gameEffects';
import { KeywordListEditor } from './KeywordListEditor';
import { TotemListEditor } from './TotemListEditor';

export type GainEntry = {
  key: string;
  type: GainType;
  amount: string;
  text: string;
  totemId: string;
};

export type LossEntry = {
  key: string;
  type: LossType;
  amount: string;
  text: string;
};

export type RewardFormState = {
  gains: GainEntry[];
  losses: LossEntry[];
  returnToShip: boolean;
  notes: string;
};

export const EMPTY_REWARD_FORM: RewardFormState = {
  gains: [],
  losses: [],
  returnToShip: false,
  notes: '',
};

type RewardFormProps = {
  campaignId?: string;
  value: RewardFormState;
  onChange: (value: RewardFormState) => void;
  showReturnToShip?: boolean;
};

function createKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getGainEntry(state: RewardFormState, type: GainType) {
  return state.gains.find((entry) => entry.type === type);
}

function getLossAmount(state: RewardFormState, type: LossType): number {
  const entry = state.losses.find((item) => item.type === type);
  const amount = Number(entry?.amount ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function setGainEntry(
  state: RewardFormState,
  type: GainType,
  patch: Partial<Pick<GainEntry, 'amount' | 'text' | 'totemId'>> | null,
): RewardFormState {
  const others = state.gains.filter((entry) => entry.type !== type);
  if (!patch) {
    return { ...state, gains: others };
  }

  const existing = getGainEntry(state, type);
  const next: GainEntry = {
    key: existing?.key ?? createKey(),
    type,
    amount: patch.amount ?? existing?.amount ?? '1',
    text: patch.text ?? existing?.text ?? '',
    totemId: patch.totemId ?? existing?.totemId ?? '',
  };

  const def = GAIN_TYPES.find((item) => item.id === type);
  const isEmpty =
    def?.input === 'amount'
      ? Number(next.amount) <= 0
      : def?.input === 'text' || def?.input === 'keywords'
        ? !next.text.trim()
        : def?.input === 'totems'
          ? !next.totemId
          : !next.totemId;

  if (isEmpty) {
    return { ...state, gains: others };
  }

  return { ...state, gains: [...others, next] };
}

function setLossAmount(
  state: RewardFormState,
  type: LossType,
  amount: number,
): RewardFormState {
  const others = state.losses.filter((entry) => entry.type !== type);
  if (amount <= 0) {
    return { ...state, losses: others };
  }

  const existing = state.losses.find((entry) => entry.type === type);
  return {
    ...state,
    losses: [
      ...others,
      {
        key: existing?.key ?? createKey(),
        type,
        amount: String(amount),
        text: existing?.text ?? '',
      },
    ],
  };
}

function addKeywordGain(state: RewardFormState, word: string): RewardFormState {
  const normalized = word.trim().toUpperCase();
  if (!normalized) return state;
  if (
    state.gains.some(
      (entry) => entry.type === 'keyword' && entry.text.toUpperCase() === normalized,
    )
  ) {
    return state;
  }
  return {
    ...state,
    gains: [
      ...state.gains,
      {
        key: createKey(),
        type: 'keyword',
        amount: '',
        text: normalized,
        totemId: '',
      },
    ],
  };
}

function removeKeywordGain(state: RewardFormState, key: string): RewardFormState {
  return {
    ...state,
    gains: state.gains.filter((entry) => !(entry.type === 'keyword' && entry.key === key)),
  };
}

function addKeywordLoss(state: RewardFormState, word: string): RewardFormState {
  const normalized = word.trim().toUpperCase();
  if (!normalized) return state;
  if (
    state.losses.some(
      (entry) => entry.type === 'keyword' && entry.text.toUpperCase() === normalized,
    )
  ) {
    return state;
  }
  return {
    ...state,
    losses: [
      ...state.losses,
      {
        key: createKey(),
        type: 'keyword',
        amount: '',
        text: normalized,
      },
    ],
  };
}

function removeKeywordLoss(state: RewardFormState, key: string): RewardFormState {
  return {
    ...state,
    losses: state.losses.filter((entry) => !(entry.type === 'keyword' && entry.key === key)),
  };
}

function addTotemGain(state: RewardFormState, totemId: string): RewardFormState {
  const id = totemId.trim();
  if (!id) return state;
  if (state.gains.some((entry) => entry.type === 'totem' && entry.totemId === id)) {
    return state;
  }
  return {
    ...state,
    gains: [
      ...state.gains,
      {
        key: createKey(),
        type: 'totem',
        amount: '1',
        text: '',
        totemId: id,
      },
    ],
  };
}

function removeTotemGain(state: RewardFormState, key: string): RewardFormState {
  return {
    ...state,
    gains: state.gains.filter((entry) => !(entry.type === 'totem' && entry.key === key)),
  };
}

function AmountEffectTile({
  icon,
  label,
  value,
  onChange,
  bad = false,
}: {
  icon: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  bad?: boolean;
}) {
  const active = value > 0;

  return (
    <div
      className={`effect-tile${active ? ' effect-tile-active' : ''}${bad ? ' effect-tile-bad' : ''}`}
    >
      <span className="effect-tile-label">{label}</span>
      <div className="effect-tile-controls">
        <button
          type="button"
          className="effect-tile-btn"
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Quitar ${label}`}
          disabled={!active}
        >
          −
        </button>
        <div className="effect-tile-center" aria-label={label}>
          <span className="effect-tile-icon" aria-hidden="true">
            {icon}
          </span>
          {active && <span className="effect-tile-count">{value}</span>}
        </div>
        <button
          type="button"
          className="effect-tile-btn"
          onClick={() => onChange(value + 1)}
          aria-label={`Añadir ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function TextEffectTile({
  icon,
  label,
  placeholder,
  value,
  onChange,
  bad = false,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  bad?: boolean;
}) {
  const [open, setOpen] = useState(() => Boolean(value.trim()));

  useEffect(() => {
    if (value.trim()) setOpen(true);
  }, [value]);

  const showInput = open || Boolean(value.trim());

  return (
    <div
      className={`effect-tile effect-tile-special${showInput ? ' effect-tile-active' : ''}${bad ? ' effect-tile-bad' : ''}`}
    >
      <span className="effect-tile-label">{label}</span>
      <div className="effect-tile-controls">
        <button
          type="button"
          className="effect-tile-btn"
          onClick={() => {
            setOpen(false);
            onChange('');
          }}
          aria-label={`Quitar ${label}`}
          disabled={!showInput}
        >
          −
        </button>
        <div className="effect-tile-center effect-tile-center-wide">
          {showInput ? (
            <input
              className="effect-tile-input"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <span className="effect-tile-icon" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>
        <button
          type="button"
          className="effect-tile-btn"
          onClick={() => setOpen(true)}
          aria-label={`Añadir ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function RewardForm({
  campaignId,
  value,
  onChange,
  showReturnToShip = true,
}: RewardFormProps) {
  function patch(partial: Partial<RewardFormState>) {
    onChange({ ...value, ...partial });
  }

  function setAmountGain(type: GainType, amount: number) {
    onChange(
      setGainEntry(value, type, amount > 0 ? { amount: String(amount) } : null),
    );
  }

  function setTextGain(type: 'artifacts', text: string) {
    onChange(setGainEntry(value, type, text.trim() ? { text } : null));
  }

  const gainKeywords = value.gains
    .filter((entry) => entry.type === 'keyword' && entry.text.trim())
    .map((entry) => ({ key: entry.key, text: entry.text }));
  const lossKeywords = value.losses
    .filter((entry) => entry.type === 'keyword' && entry.text.trim())
    .map((entry) => ({ key: entry.key, text: entry.text }));
  const gainTotems = value.gains
    .filter((entry) => entry.type === 'totem' && entry.totemId)
    .map((entry) => ({ key: entry.key, totemId: entry.totemId }));

  return (
    <div className="reward-form">
      <fieldset className="outcome-fieldset">
        <legend>Bueno</legend>
        <p className="muted section-hint">Elementos que ganas al elegir esta opción.</p>
        <div className="effect-picker" role="group" aria-label="Recompensas">
          {GAIN_TYPES.filter(
            (item) => item.input !== 'keywords' && item.input !== 'totems',
          ).map((item) => {
            if (item.input === 'amount') {
              const amount = Number(getGainEntry(value, item.id)?.amount ?? 0);
              return (
                <AmountEffectTile
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  value={Number.isFinite(amount) && amount > 0 ? amount : 0}
                  onChange={(next) => setAmountGain(item.id, next)}
                />
              );
            }

            if (item.input === 'text') {
              const text = getGainEntry(value, item.id)?.text ?? '';
              return (
                <TextEffectTile
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  placeholder="Nombre del artefacto"
                  value={text}
                  onChange={(next) => setTextGain(item.id, next)}
                />
              );
            }

            return null;
          })}
        </div>
        <TotemListEditor
          campaignId={campaignId}
          entries={gainTotems}
          onAdd={(totemId) => onChange(addTotemGain(value, totemId))}
          onRemove={(key) => onChange(removeTotemGain(value, key))}
        />
        <KeywordListEditor
          icon="🔑"
          label="Añadir palabra"
          entries={gainKeywords}
          onAdd={(word) => onChange(addKeywordGain(value, word))}
          onRemove={(key) => onChange(removeKeywordGain(value, key))}
        />
      </fieldset>

      <fieldset className="outcome-fieldset">
        <legend>Malo</legend>
        <p className="muted section-hint">Penalizaciones al elegir esta opción.</p>
        <div className="effect-picker" role="group" aria-label="Penalizaciones">
          {LOSS_TYPES.filter((item) => item.input !== 'keywords').map((item) => (
            <AmountEffectTile
              key={item.id}
              icon={item.icon}
              label={item.label}
              value={getLossAmount(value, item.id)}
              onChange={(next) => onChange(setLossAmount(value, item.id, next))}
              bad
            />
          ))}
        </div>
        <KeywordListEditor
          icon="🔑"
          label="Quitar palabra"
          entries={lossKeywords}
          onAdd={(word) => onChange(addKeywordLoss(value, word))}
          onRemove={(key) => onChange(removeKeywordLoss(value, key))}
          bad
        />
      </fieldset>

      <label>
        Notas
        <textarea
          rows={2}
          placeholder="Ej: carta de aventura, recompensa del mercado..."
          value={value.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>

      {showReturnToShip && (
        <label className="checkbox-label checkbox-label-compact">
          <input
            type="checkbox"
            checked={value.returnToShip}
            onChange={(e) => patch({ returnToShip: e.target.checked })}
          />
          Volver al barco
        </label>
      )}
    </div>
  );
}

function isGainEntryValid(entry: GainEntry): boolean {
  const def = GAIN_TYPES.find((item) => item.id === entry.type);
  if (!def) return false;
  if (def.input === 'amount') {
    const amount = Number(entry.amount);
    return Number.isFinite(amount) && amount > 0;
  }
  if (def.input === 'text' || def.input === 'keywords') return Boolean(entry.text.trim());
  if (def.input === 'totems') return Boolean(entry.totemId);
  return false;
}

function isLossEntryValid(entry: LossEntry): boolean {
  const def = LOSS_TYPES.find((item) => item.id === entry.type);
  if (!def) return false;
  if (def.input === 'keywords') return Boolean(entry.text.trim());
  const amount = Number(entry.amount);
  return Number.isFinite(amount) && amount > 0;
}

export function isRewardFormValid(value: RewardFormState): boolean {
  if (value.gains.some((entry) => !isGainEntryValid(entry))) return false;
  if (value.losses.some((entry) => !isLossEntryValid(entry))) return false;

  const hasValidGain = value.gains.some(isGainEntryValid);
  const hasValidLoss = value.losses.some(isLossEntryValid);

  return hasValidGain || hasValidLoss || value.returnToShip || Boolean(value.notes.trim());
}

export function toRewardPayload(value: RewardFormState): OutcomePayload {
  return {
    gains: value.gains.filter(isGainEntryValid).map((entry) => {
      const def = GAIN_TYPES.find((item) => item.id === entry.type);
      const item: GainItem = { type: entry.type };
      if (def?.input === 'amount') {
        item.amount = Number(entry.amount);
      }
      if (def?.input === 'text' || def?.input === 'keywords') {
        item.text = entry.text.trim().toUpperCase();
      }
      if (def?.input === 'totems') {
        item.totemId = entry.totemId;
      }
      return item;
    }),
    losses: value.losses.filter(isLossEntryValid).map((entry) => {
      const def = LOSS_TYPES.find((item) => item.id === entry.type);
      const item: LossItem = { type: entry.type };
      if (def?.input === 'keywords') {
        item.text = entry.text.trim().toUpperCase();
      } else {
        item.amount = Number(entry.amount);
      }
      return item;
    }),
    returnToShip: value.returnToShip || undefined,
    notes: value.notes.trim() || undefined,
  };
}
