import {
  CREW_SKILL_COLORS,
  CREW_SKILLS,
  type CrewSkill,
} from '../constants/crewSkills';

type StatSelectProps = {
  value: CrewSkill;
  onChange: (value: CrewSkill) => void;
  id?: string;
};

export function StatSelect({ value, onChange, id }: StatSelectProps) {
  return (
    <select
      id={id}
      className="stat-select"
      value={value}
      onChange={(e) => onChange(e.target.value as CrewSkill)}
      style={{
        borderColor: CREW_SKILL_COLORS[value],
        backgroundColor: `${CREW_SKILL_COLORS[value]}22`,
      }}
    >
      {CREW_SKILLS.map((skill) => (
        <option
          key={skill}
          value={skill}
          style={{
            backgroundColor: CREW_SKILL_COLORS[skill],
            color: '#fff',
          }}
        >
          {skill}
        </option>
      ))}
    </select>
  );
}

type StatValueRowProps = {
  stat: CrewSkill;
  value: string;
  onStatChange: (value: CrewSkill) => void;
  onValueChange: (value: string) => void;
};

export function StatValueRow({
  stat,
  value,
  onStatChange,
  onValueChange,
}: StatValueRowProps) {
  return (
    <div className="stat-value-row">
      <StatSelect value={stat} onChange={onStatChange} />
      <input
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="5"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-label="Valor de la prueba"
      />
    </div>
  );
}
