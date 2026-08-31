import { useEffect, useState } from 'react';

import { getTotems } from '../api/totems';
import type { Totem } from '../types';
import { TotemSearchPicker } from './TotemSearchPicker';

type TotemEntry = {
  key: string;
  totemId: string;
};

type TotemListEditorProps = {
  campaignId?: string;
  entries: TotemEntry[];
  onAdd: (totemId: string) => void;
  onRemove: (key: string) => void;
};

export function TotemListEditor({
  campaignId,
  entries,
  onAdd,
  onRemove,
}: TotemListEditorProps) {
  const [totems, setTotems] = useState<Totem[]>([]);

  useEffect(() => {
    let active = true;
    void getTotems(campaignId)
      .then((items) => {
        if (active) setTotems(items);
      })
      .catch(() => {
        if (active) setTotems([]);
      });

    return () => {
      active = false;
    };
  }, [campaignId]);

  const totemById = new Map(totems.map((totem) => [totem.id, totem]));
  const usedIds = entries.map((entry) => entry.totemId);

  return (
    <div
      className={`keyword-list-editor${entries.length > 0 ? ' keyword-list-editor-active' : ''}`}
    >
      <div className="keyword-list-header">
        <span className="keyword-list-icon" aria-hidden="true">
          🗿
        </span>
        <span className="keyword-list-label">Añadir tótem</span>
      </div>

      {entries.length > 0 && (
        <ul className="keyword-chip-list">
          {entries.map((entry) => (
            <li key={entry.key} className="keyword-chip">
              <span>{totemById.get(entry.totemId)?.name ?? 'Tótem'}</span>
              <button
                type="button"
                className="btn-icon keyword-chip-remove"
                onClick={() => onRemove(entry.key)}
                aria-label={`Quitar ${totemById.get(entry.totemId)?.name ?? 'tótem'}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <TotemSearchPicker
        campaignId={campaignId}
        excludeIds={usedIds}
        clearAfterPick
        inputClassName="keyword-add-input totem-search-input"
        placeholder="Buscar tótem..."
        onChange={(totemId) => {
          if (totemId) onAdd(totemId);
        }}
      />
    </div>
  );
}
