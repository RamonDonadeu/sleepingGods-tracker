import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getLocationState } from '../api/locations';
import { registerVisit } from '../api/visits';
import { PageActions } from '../components/PageActions';
import { useCampaign } from '../context/CampaignContext';
import type { LocationStatus, VisitOption } from '../types';

const emptyOption = (): VisitOption => ({
  label: '',
  outcomes: [''],
  chosen: false,
});

export function VisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeCampaign } = useCampaign();

  const [locationNumber, setLocationNumber] = useState('');
  const [requiredKeyword, setRequiredKeyword] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<LocationStatus>('VISITED');
  const [options, setOptions] = useState<VisitOption[]>([emptyOption()]);
  const [keywordsDiscovered, setKeywordsDiscovered] = useState('');
  const [totemsFound, setTotemsFound] = useState('');
  const [resources, setResources] = useState('');
  const [combats, setCombats] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !activeCampaign) return;
    getLocationState(id, activeCampaign.id).then((state) => {
      setLocationNumber(String(state.location.number));
    });
  }, [id, activeCampaign]);

  function updateOption(index: number, patch: Partial<VisitOption>) {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)),
    );
  }

  function updateOutcome(optionIndex: number, outcomeIndex: number, value: string) {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== optionIndex) return opt;
        const outcomes = [...opt.outcomes];
        outcomes[outcomeIndex] = value;
        return { ...opt, outcomes };
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!id || !activeCampaign) return;

    setSaving(true);
    setError(null);
    try {
      await registerVisit(activeCampaign.id, id, {
        status,
        requiredKeyword: requiredKeyword || undefined,
        notes: notes || undefined,
        options: options
          .filter((o) => o.label.trim())
          .map((o) => ({
            ...o,
            outcomes: o.outcomes.filter((out) => out.trim()),
          })),
        keywordsDiscovered: keywordsDiscovered
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        totemsFound: totemsFound
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        resources: resources
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
        combats: combats
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      });
      navigate(`/locations/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving visit');
    } finally {
      setSaving(false);
    }
  }

  if (!activeCampaign) {
    return (
      <section className="page">
        <p className="muted">Selecciona una campaña activa.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Registrar visita · #{locationNumber || '...'}</h1>
        <p className="page-description">
          Lo que registres aquí se guarda en la campaña actual y como
          conocimiento global.
        </p>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <form className="card form-card" onSubmit={handleSubmit}>
        <label>
          Estado en campaña
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LocationStatus)}
          >
            <option value="VISITED">Visitada</option>
            <option value="PENDING">Pendiente (decisiones sin resolver)</option>
          </select>
        </label>

        <label>
          Palabra clave requerida
          <input
            value={requiredKeyword}
            onChange={(e) => setRequiredKeyword(e.target.value)}
            placeholder="RATON"
          />
        </label>

        <fieldset className="fieldset">
          <legend>Opciones y decisiones</legend>
          {options.map((option, optionIndex) => (
            <div key={optionIndex} className="option-block">
              <label>
                Opción {String.fromCharCode(65 + optionIndex)}
                <input
                  value={option.label}
                  onChange={(e) =>
                    updateOption(optionIndex, { label: e.target.value })
                  }
                  placeholder="Ej: Hablar con el ermitaño"
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={option.chosen}
                  onChange={(e) =>
                    updateOption(optionIndex, { chosen: e.target.checked })
                  }
                />
                Elegida en esta visita
              </label>
              {option.outcomes.map((outcome, outcomeIndex) => (
                <input
                  key={outcomeIndex}
                  value={outcome}
                  onChange={(e) =>
                    updateOutcome(optionIndex, outcomeIndex, e.target.value)
                  }
                  placeholder="Resultado: +2 carne, combate, KW:LAGO..."
                />
              ))}
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  updateOption(optionIndex, {
                    outcomes: [...option.outcomes, ''],
                  })
                }
              >
                + Resultado
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={() => setOptions((prev) => [...prev, emptyOption()])}
          >
            + Opción
          </button>
        </fieldset>

        <label>
          Palabras clave descubiertas (separadas por coma)
          <input
            value={keywordsDiscovered}
            onChange={(e) => setKeywordsDiscovered(e.target.value)}
            placeholder="FALCON, GROWTH"
          />
        </label>

        <label>
          Tótems conseguidos (separados por coma)
          <input
            value={totemsFound}
            onChange={(e) => setTotemsFound(e.target.value)}
            placeholder="Piedra de Puerta"
          />
        </label>

        <label>
          Recursos (separados por coma)
          <input
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            placeholder="2 carne, 1 hierro"
          />
        </label>

        <label>
          Combates (separados por coma)
          <input
            value={combats}
            onChange={(e) => setCombats(e.target.value)}
            placeholder="Lobo del pantano"
          />
        </label>

        <label>
          Notas
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <PageActions sticky={false}>
          <button type="submit" className="btn primary btn-block" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar visita'}
          </button>
        </PageActions>
      </form>

      <Link className="btn link" to={`/locations/${id}`}>
        Cancelar
      </Link>
    </section>
  );
}
