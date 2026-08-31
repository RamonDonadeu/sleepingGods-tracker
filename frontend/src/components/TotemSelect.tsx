import { TotemSearchPicker } from './TotemSearchPicker';

type TotemSelectProps = {
  campaignId?: string;
  value: string;
  onChange: (totemId: string) => void;
};

export function TotemSelect({ campaignId, value, onChange }: TotemSelectProps) {
  return (
    <TotemSearchPicker
      campaignId={campaignId}
      value={value}
      onChange={onChange}
      placeholder="Buscar tótem..."
    />
  );
}
