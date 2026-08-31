import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTotem, setTotemCampaignStatus } from '../api/totems';
import type { TotemDetail } from '../types';

export function TotemDetailPage() {
  const { id } = useParams();
  const [totem, setTotem] = useState<TotemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    const data = await getTotem(id);
    setTotem(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function toggleStatus(campaignId: string, obtained: boolean) {
    if (!id) return;
    await setTotemCampaignStatus(campaignId, id, !obtained);
    await load();
  }

  if (loading) return <p className="muted">Cargando...</p>;
  if (!totem) return null;

  return (
    <section className="page">
      <header className="page-header">
        <h1>{totem.name}</h1>
      </header>

      <div className="card">
        <h2>Descubrimiento</h2>
        <p>{totem.discovered ? 'Sí' : 'No'}</p>
        {totem.discoveredCampaign && (
          <p>Campaña: {totem.discoveredCampaign.name}</p>
        )}
        {totem.discoveredLocation && (
          <p>Localización: #{totem.discoveredLocation.number}</p>
        )}
        {totem.notes && <p className="muted">{totem.notes}</p>}
      </div>

      <div className="card">
        <h2>Estado por campaña</h2>
        <ul className="list">
          {totem.campaignHistory.map(({ campaign, obtained }) => (
            <li key={campaign.id} className="list-item">
              <div>
                <strong>{campaign.name}</strong>
                <p>{obtained ? '✅ Conseguido' : '❌ No conseguido'}</p>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => toggleStatus(campaign.id, obtained)}
              >
                Cambiar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Link className="btn link" to="/totems">
        Volver
      </Link>
    </section>
  );
}
