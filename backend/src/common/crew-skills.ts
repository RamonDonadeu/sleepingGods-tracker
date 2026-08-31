export const CREW_SKILLS = [
  'STRENGTH',
  'PERCEPTION',
  'SAVVY',
  'CUNNING',
  'CRAFT',
] as const;

export type CrewSkill = (typeof CREW_SKILLS)[number];

export function normalizeCrewSkill(stat?: string): CrewSkill | undefined {
  if (!stat) return undefined;
  const normalized = stat.trim().toUpperCase();
  return (CREW_SKILLS as readonly string[]).includes(normalized)
    ? (normalized as CrewSkill)
    : undefined;
}
