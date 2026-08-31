import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { search, type KeywordSearchResult, type LocationSearchResult } from '../api/search';
import { markVisited } from '../api/knowledge';
import { useCampaign } from '../context/CampaignContext';

export function SearchPage() {
  const { activeCampaign } = useCampaign();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [result, setResult] = useState<
    LocationSearchResult | KeywordSearchResult | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCampaign) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await search(trimmed, activeCampaign.id);
          if (data.type === 'empty') {
            setResult(null);
          } else if (data.type === 'location' || data.type === 'keyword') {
            setResult(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error en la búsqueda');
          setResult(null);
        } finally {
          setLoading(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, activeCampaign]);

  async function handleVisit(locationId: string) {
    if (!activeCampaign) return;
    await markVisited(activeCampaign.id, locationId);
    navigate(`/locations/${locationId}`);
  }

  if (!activeCampaign) {
    return (
      <section className="page">
        <div className="card empty-state">
          <p className="muted">Selecciona una campaña para empezar.</p>
          <Link className="btn primary btn-block" to="/campaigns">
            Ir a campañas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page search-page">
      <header className="page-header">
        <h1>Buscar</h1>
        <p className="page-description">
          Escribe un número de localización o una palabra clave.
        </p>
      </header>

      <div className="search-bar">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: 47, 34.1 o RATON"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="search-status">Buscando...</span>}
      </div>

      {error && <p className="error-banner">{error}</p>}

      {!loading && query.trim() && !result && !error && (
        <p className="muted">Sin resultados.</p>
      )}

      {result?.type === 'location' && (
        <div className="card search-result">
          <div className="search-result-header">
            <h2>#{result.location.number}</h2>
            {result.location.name && (
              <p className="muted">{result.location.name}</p>
            )}
          </div>
          <p className={`status-badge status-${result.campaignStatus.toLowerCase()}`}>
            {result.visited ? '🟢 Visitada' : '⚪ Sin visitar'}
            {result.hasPriorKnowledge && !result.visited && ' · 🧠 Conocimiento previo'}
          </p>
          <button
            type="button"
            className="btn primary btn-block"
            onClick={() => handleVisit(result.location.id)}
          >
            Visitar
          </button>
        </div>
      )}

      {result?.type === 'keyword' && (
        <div className="card search-result">
          <h2>Palabra: {result.query}</h2>
          {result.keyword ? (
            <p className="muted">
              Registrada ·{' '}
              <Link to={`/keywords/${result.keyword.id}`}>Ver historial</Link>
            </p>
          ) : (
            <p className="muted">No está en tu colección global aún.</p>
          )}

          {result.locations.length === 0 ? (
            <p className="muted">No hay localizaciones registradas con esta palabra.</p>
          ) : (
            <ul className="list">
              {result.locations.map((loc) => (
                <li key={`${loc.id}-${loc.content}`} className="list-item">
                  <div>
                    <strong>#{loc.number}</strong>
                    <p className="muted">{loc.content}</p>
                    <p className="muted">{loc.campaignName}</p>
                  </div>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => navigate(`/locations/${loc.id}`)}
                  >
                    Abrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
