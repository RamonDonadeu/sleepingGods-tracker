import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCampaignMap } from '../api/campaigns';
import { createLocation } from '../api/locations';
import { useCampaign } from '../context/CampaignContext';
import type { MapLocation } from '../types';

function statusIcon(location: MapLocation) {
  if (location.campaignStatus === 'VISITED') return '🟢';
  if (location.campaignStatus === 'PENDING') return '🟡';
  if (location.hasPriorKnowledge) return '🧠';
  return '⚪';
}

export function MapPage() {
  const { activeCampaign } = useCampaign();
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMap() {
    if (!activeCampaign) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaignMap(activeCampaign.id);
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading map');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMap();
  }, [activeCampaign]);

  async function handleAddLocation(event: React.FormEvent) {
    event.preventDefault();
    const code = newNumber.trim();
    if (!code) return;

    await createLocation({ number: code, name: newName || undefined });
    setNewNumber('');
    setNewName('');
    await loadMap();
  }

  if (!activeCampaign) {
    return (
      <section className="page">
        <div className="card empty-state">
          <p className="muted">Selecciona una campaña activa para ver el mapa.</p>
          <Link className="btn primary btn-block" to="/">
            Ir a campañas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Mapa</h1>
        <p className="page-description">
          Estado de <strong>{activeCampaign.name}</strong>. El conocimiento previo
          no marca localizaciones como visitadas.
        </p>
      </header>

      <form className="card form-card inline-form" onSubmit={handleAddLocation}>
        <h2>Añadir localización</h2>
        <div className="inline-fields">
          <label>
            Número
            <input
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="34 o 34.1"
            />
          </label>
          <label>
            Nombre (opcional)
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Bahía oculta"
            />
          </label>
          <button type="submit" className="btn primary btn-block" disabled={!newNumber}>
            Añadir al mapa
          </button>
        </div>
      </form>

      <div className="legend card">
        <span>⚪ Sin visitar</span>
        <span>🟢 Visitada</span>
        <span>🧠 Conocimiento previo</span>
        <span>🟡 Pendiente</span>
      </div>

      {loading && <p className="muted">Cargando mapa...</p>}
      {error && <p className="error-banner">{error}</p>}

      {!loading && locations.length === 0 && (
        <p className="muted">
          Añade localizaciones por número para empezar a registrar visitas.
        </p>
      )}

      <div className="map-grid">
        {locations.map((location) => (
          <Link
            key={location.id}
            to={`/locations/${location.id}`}
            className={`map-tile status-${location.campaignStatus.toLowerCase()} ${
              location.hasPriorKnowledge ? 'has-knowledge' : ''
            }`}
          >
            <span className="map-tile-icon">{statusIcon(location)}</span>
            <span className="map-tile-number">#{location.number}</span>
            {location.name && (
              <span className="map-tile-name">{location.name}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
