import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addKeywordUsage, getKeyword } from '../api/keywords';
import { useCampaign } from '../context/CampaignContext';
import type { KeywordDetail } from '../types';

export function KeywordDetailPage() {
  const { id } = useParams();
  const { activeCampaign } = useCampaign();
  const [keyword, setKeyword] = useState<KeywordDetail | null>(null);
  const [usageNotes, setUsageNotes] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    const data = await getKeyword(id);
    setKeyword(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function handleAddUsage() {
    if (!id) return;
    await addKeywordUsage(id, {
      campaignId: activeCampaign?.id,
      notes: usageNotes || undefined,
    });
    setUsageNotes('');
    await load();
  }

  if (loading) return <p className="muted">Cargando...</p>;
  if (!keyword) return null;

  return (
    <section className="page">
      <header className="page-header">
        <h1>{keyword.word}</h1>
      </header>

      <div className="card">
        <h2>Descubrimiento</h2>
        <p>
          {keyword.discoveredCampaign
            ? `Campaña: ${keyword.discoveredCampaign.name}`
            : 'Sin campaña de origen registrada'}
        </p>
        <p>
          {keyword.discoveredLocation
            ? `Localización: #${keyword.discoveredLocation.number}`
            : 'Sin localización de origen registrada'}
        </p>
        <p className="muted">
          {new Date(keyword.discoveredAt).toLocaleString()}
        </p>
      </div>

      <div className="card">
        <h2>Usos registrados</h2>
        {keyword.usages.length === 0 ? (
          <p className="muted">Sin usos registrados.</p>
        ) : (
          <ul className="list">
            {keyword.usages.map((usage) => (
              <li key={usage.id} className="list-item">
                <div>
                  <p>
                    {usage.campaign?.name ?? 'Sin campaña'} ·{' '}
                    {usage.location
                      ? `#${usage.location.number}`
                      : 'Sin localización'}
                  </p>
                  {usage.notes && <p className="muted">{usage.notes}</p>}
                  <p className="muted">
                    {new Date(usage.usedAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label>
          Registrar uso
          <input
            value={usageNotes}
            onChange={(e) => setUsageNotes(e.target.value)}
            placeholder="Usada en localización #12..."
          />
        </label>
        <button type="button" className="btn secondary" onClick={handleAddUsage}>
          Añadir uso
        </button>
      </div>

      <Link className="btn link" to="/keywords">
        Volver
      </Link>
    </section>
  );
}
