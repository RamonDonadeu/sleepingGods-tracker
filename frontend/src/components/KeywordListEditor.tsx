import { useState } from 'react';

type KeywordEntry = {
  key: string;
  text: string;
};

type KeywordListEditorProps = {
  icon: string;
  label: string;
  placeholder?: string;
  entries: KeywordEntry[];
  onAdd: (word: string) => void;
  onRemove: (key: string) => void;
  bad?: boolean;
};

export function KeywordListEditor({
  icon,
  label,
  placeholder = 'Ej: BOSQUE',
  entries,
  onAdd,
  onRemove,
  bad = false,
}: KeywordListEditorProps) {
  const [draft, setDraft] = useState('');

  function commit() {
    const word = draft.trim();
    if (!word) return;
    onAdd(word);
    setDraft('');
  }

  return (
    <div
      className={`keyword-list-editor${bad ? ' keyword-list-editor-bad' : ''}${entries.length > 0 ? ' keyword-list-editor-active' : ''}`}
    >
      <div className="keyword-list-header">
        <span className="keyword-list-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="keyword-list-label">{label}</span>
      </div>

      {entries.length > 0 && (
        <ul className="keyword-chip-list">
          {entries.map((entry) => (
            <li key={entry.key} className="keyword-chip">
              <span>{entry.text}</span>
              <button
                type="button"
                className="btn-icon keyword-chip-remove"
                onClick={() => onRemove(entry.key)}
                aria-label={`Quitar ${entry.text}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="keyword-add-row">
        <input
          className="keyword-add-input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button
          type="button"
          className="btn secondary keyword-add-btn"
          onClick={commit}
          disabled={!draft.trim()}
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
