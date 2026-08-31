import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createTotem, getTotems, setTotemCampaignStatus } from '../api/totems';
import { useCampaign } from '../context/CampaignContext';
import type { Totem } from '../types';

export function TotemsPage() {
  const { activeCampaign } = useCampaign();
  const [totems, setTotems] = useState<Totem[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getTotems(activeCampaign?.id);
    setTotems(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [activeCampaign]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    await createTotem({ name: newName.trim() });
    setNewName('');
    await load();
  }

  async function toggleObtained(totem: Totem) {
    if (!activeCampaign) return;
    await setTotemCampaignStatus(
      activeCampaign.id,
      totem.id,
      !totem.obtainedInCampaign,
    );
    await load();
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Tótems</h1>
        <p className="page-description">
          Conocimiento global. Conseguirlo en una campaña anterior no implica
          tenerlo en la actual.
        </p>
      </header>

      <form className="card form-card inline-form" onSubmit={handleCreate}>
        <div className="inline-fields">
          <label>
            Nuevo tótem
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Piedra de Puerta"
            />
          </label>
          <button type="submit" className="btn primary" disabled={!newName.trim()}>
            Añadir
          </button>
        </div>
      </form>

      <div className="card">
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : totems.length === 0 ? (
          <p className="muted">Aún no hay tótems registrados.</p>
        ) : (
          <ul className="list">
            {totems.map((totem) => (
              <li key={totem.id} className="list-item">
                <div>
                  <Link to={`/totems/${totem.id}`}>
                    <strong>{totem.name}</strong>
                  </Link>
                  <p className="muted">
                    {totem.discovered ? 'Descubierto' : 'No descubierto'}
                    {activeCampaign &&
                      ` · Campaña actual: ${totem.obtainedInCampaign ? '✅' : '❌'}`}
                  </p>
                </div>
                {activeCampaign && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => toggleObtained(totem)}
                  >
                    {totem.obtainedInCampaign ? 'Quitar' : 'Conseguido'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
