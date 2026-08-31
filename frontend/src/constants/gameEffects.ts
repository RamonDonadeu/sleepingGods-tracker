export const GAIN_TYPES = [
  { id: 'materials', label: 'Materiales', icon: '🪵', input: 'amount' },
  { id: 'gold', label: 'Oro', icon: '🪙', input: 'amount' },
  { id: 'xp', label: 'XP', icon: '⭐', input: 'amount' },
  { id: 'cereals', label: 'Cereales', icon: '🌾', input: 'amount' },
  { id: 'vegetables', label: 'Verduras', icon: '🥬', input: 'amount' },
  { id: 'meat', label: 'Carne', icon: '🥩', input: 'amount' },
  { id: 'artifacts', label: 'Artefacto', icon: '🏺', input: 'text' },
  { id: 'keyword', label: 'Añadir palabra', icon: '🔑', input: 'keywords' },
  { id: 'totem', label: 'Tótem', icon: '🗿', input: 'totems' },
] as const;

export const LOSS_TYPES = [
  { id: 'poison', label: 'Veneno', icon: '☠️', input: 'amount' },
  { id: 'fatigue', label: 'Cansancio', icon: '😴', input: 'amount' },
  { id: 'damage', label: 'Daño', icon: '💔', input: 'amount' },
  { id: 'lowMorale', label: 'Moral baja', icon: '📉', input: 'amount' },
  { id: 'navalDamage', label: 'Daño naval', icon: '⚓', input: 'amount' },
  { id: 'keyword', label: 'Quitar palabra', icon: '🔑', input: 'keywords' },
] as const;

export type GainType = (typeof GAIN_TYPES)[number]['id'];
export type LossType = (typeof LOSS_TYPES)[number]['id'];

export const GAIN_LABELS = Object.fromEntries(
  GAIN_TYPES.map((item) => [item.id, item.label]),
) as Record<GainType, string>;

export const GAIN_ICONS = Object.fromEntries(
  GAIN_TYPES.map((item) => [item.id, item.icon]),
) as Record<GainType, string>;

export const LOSS_LABELS = Object.fromEntries(
  LOSS_TYPES.map((item) => [item.id, item.label]),
) as Record<LossType, string>;

export const LOSS_ICONS = Object.fromEntries(
  LOSS_TYPES.map((item) => [item.id, item.icon]),
) as Record<LossType, string>;

export type GainItem = {
  type: GainType;
  amount?: number;
  text?: string;
  totemId?: string;
  totemName?: string;
};

export type LossItem = {
  type: LossType;
  amount?: number;
  text?: string;
};

export type OutcomePayload = {
  gains?: GainItem[];
  losses?: LossItem[];
  returnToShip?: boolean;
  notes?: string;
};

export function getGainDef(type: GainType) {
  return GAIN_TYPES.find((item) => item.id === type);
}

export function getLossDef(type: LossType) {
  return LOSS_TYPES.find((item) => item.id === type);
}
