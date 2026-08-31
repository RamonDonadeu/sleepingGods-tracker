export const CREW_SKILLS = [
  'STRENGTH',
  'PERCEPTION',
  'SAVVY',
  'CUNNING',
  'CRAFT',
] as const;

export type CrewSkill = (typeof CREW_SKILLS)[number];

export const DEFAULT_CREW_SKILL: CrewSkill = 'STRENGTH';

export const CREW_SKILL_COLORS: Record<CrewSkill, string> = {
  STRENGTH: '#e74c3c',
  PERCEPTION: '#3498db',
  SAVVY: '#9b59b6',
  CUNNING: '#27ae60',
  CRAFT: '#f39c12',
};

export function isCrewSkill(value: string): value is CrewSkill {
  return (CREW_SKILLS as readonly string[]).includes(value);
}

