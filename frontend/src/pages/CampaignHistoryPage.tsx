import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCampaignSummary } from '../api/campaigns';
import type { CampaignSummary } from '../types';

export function CampaignHistoryPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCampaignSummary(id)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error loading summary'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Cargando resumen...</p>;
  if (error) return <p className="error-banner">{error}</p>;
  if (!summary) return null;

  const {
    campaign,
    players,
    startingKeywords,
    visitedLocations,
    visits,
    keywordsDiscovered,
    totemsObtained,
  } = summary;

  return (
    <section className="page">
      <header className="page-header">
        <h1>{campaign.name}</h1>
        <p className="page-description">
          {campaign.status === 'ACTIVE' ? 'Activa' : 'Terminada'} · Inicio:{' '}
          {new Date(campaign.startedAt).toLocaleDateString()}
          {campaign.endedAt &&
            ` · Fin: ${new Date(campaign.endedAt).toLocaleDateString()}`}
          {campaign.didTutorial ? ' · Tutorial' : ' · Sin tutorial'}
        </p>
      </header>

      {(players.length > 0 || startingKeywords.length > 0) && (
        <div className="card">
          <h2>Inicio de campaña</h2>
          {players.length > 0 && (
            <p>
              <strong>Jugadores:</strong> {players.join(', ')}
            </p>
          )}
          {startingKeywords.length > 0 && (
            <p>
              <strong>Palabras iniciales:</strong>{' '}
              {startingKeywords.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h2>Localizaciones visitadas ({visitedLocations.length})</h2>
        {visitedLocations.length === 0 ? (
          <p className="muted">Ninguna visitada aún.</p>
        ) : (
          <ul className="chip-list">
            {visitedLocations.map((entry) => (
              <li key={entry.location.id}>
                <Link className="chip" to={`/locations/${entry.location.id}`}>
                  #{entry.location.number}
                  {entry.location.name ? ` ${entry.location.name}` : ''}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Visitas ({visits.length})</h2>
        {visits.length === 0 ? (
          <p className="muted">Sin visitas registradas.</p>
        ) : (
          <ul className="list">
            {visits.map((visit) => (
              <li key={visit.id} className="list-item">
                <div>
                  <strong>
                    #{visit.location.number}
                    {visit.location.name ? ` — ${visit.location.name}` : ''}
                  </strong>
                  <p className="muted">
                    {new Date(visit.visitedAt).toLocaleString()}
                  </p>
                  {visit.notes && <p>{visit.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Palabras clave descubiertas ({keywordsDiscovered.length})</h2>
        {keywordsDiscovered.length === 0 ? (
          <p className="muted">Ninguna.</p>
        ) : (
          <ul className="chip-list">
            {keywordsDiscovered.map((kw) => (
              <li key={kw.id}>
                <Link className="chip" to={`/keywords/${kw.id}`}>
                  {kw.word}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Tótems conseguidos ({totemsObtained.length})</h2>
        {totemsObtained.length === 0 ? (
          <p className="muted">Ninguno.</p>
        ) : (
          <ul className="chip-list">
            {totemsObtained.map((totem) => (
              <li key={totem.id}>
                <Link className="chip" to={`/totems/${totem.id}`}>
                  {totem.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link className="btn link" to="/">
        Volver a campañas
      </Link>
    </section>
  );
}
