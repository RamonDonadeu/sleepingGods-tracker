import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { getTotems } from '../api/totems';
import type { Totem } from '../types';

type TotemSearchPickerProps = {
  campaignId?: string;
  value?: string;
  excludeIds?: string[];
  onChange: (totemId: string) => void;
  placeholder?: string;
  /** Tras elegir, vacía el campo (útil al añadir varios). */
  clearAfterPick?: boolean;
  inputClassName?: string;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function TotemSearchPicker({
  campaignId,
  value = '',
  excludeIds = [],
  onChange,
  placeholder = 'Buscar tótem...',
  clearAfterPick = false,
  inputClassName,
}: TotemSearchPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [totems, setTotems] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getTotems(campaignId)
      .then((items) => {
        if (active) setTotems(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [campaignId]);

  const totemById = useMemo(
    () => new Map(totems.map((totem) => [totem.id, totem])),
    [totems],
  );

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filteredTotems = useMemo(() => {
    const available = totems.filter((totem) => !excluded.has(totem.id));
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return available;

    return available.filter((totem) =>
      normalizeText(totem.name).includes(normalizedQuery),
    );
  }, [totems, excluded, query]);

  const selectedTotem = value ? totemById.get(value) : undefined;
  const showSelectedLabel = Boolean(selectedTotem) && !isOpen && !query;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, filteredTotems.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function pick(totemId: string) {
    onChange(totemId);
    if (clearAfterPick) {
      setQuery('');
    } else if (totemById.has(totemId)) {
      setQuery(totemById.get(totemId)!.name);
    }
    setIsOpen(false);
  }

  function commitActive() {
    const totem = filteredTotems[activeIndex];
    if (totem) pick(totem.id);
  }

  if (loading) {
    return <p className="muted">Cargando tótems...</p>;
  }

  if (totems.length === 0) {
    return (
      <p className="muted">
        No hay tótems registrados.{' '}
        <Link to="/totems">Crear uno en Tótems</Link>
      </p>
    );
  }

  return (
    <div className="totem-search-picker" ref={rootRef}>
      <input
        type="search"
        className={inputClassName ?? 'totem-search-input'}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={showSelectedLabel ? selectedTotem!.name : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (value) onChange('');
        }}
        onFocus={() => {
          setIsOpen(true);
          if (showSelectedLabel) {
            setQuery('');
            onChange('');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) =>
              Math.min(index + 1, Math.max(filteredTotems.length - 1, 0)),
            );
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            commitActive();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      />

      {isOpen && (
        <ul id={listId} className="totem-search-results" role="listbox">
          {filteredTotems.length === 0 ? (
            <li className="totem-search-empty muted">Sin coincidencias</li>
          ) : (
            filteredTotems.map((totem, index) => (
              <li key={totem.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`totem-search-option${index === activeIndex ? ' totem-search-option-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(totem.id)}
                >
                  <span>{totem.name}</span>
                  {totem.obtainedInCampaign && (
                    <span className="totem-search-badge" aria-label="Conseguido">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
