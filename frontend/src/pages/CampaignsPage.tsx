import { useState } from 'react';
import { Link } from 'react-router-dom';
import { completeCampaign, createCampaign } from '../api/campaigns';
import { useCampaign } from '../context/CampaignContext';
import { getStartingKeywords, parseCampaignPlayers } from '../types';

export function CampaignsPage() {
  const {
    campaigns,
    activeCampaignId,
    loading,
    error,
    setActiveCampaignId,
    refreshCampaigns,
  } = useCampaign();
  const [name, setName] = useState('');
  const [players, setPlayers] = useState('');
  const [didTutorial, setDidTutorial] = useState(false);
  const [keyword1, setKeyword1] = useState('');
  const [keyword2, setKeyword2] = useState('');
  const [creating, setCreating] = useState(false);

  function resetForm() {
    setName('');
    setPlayers('');
    setDidTutorial(false);
    setKeyword1('');
    setKeyword2('');
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const startingKeywords = [keyword1, keyword2].map((k) => k.trim()).filter(Boolean);
    const playerList = players
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    setCreating(true);
    try {
      const campaign = await createCampaign({
        name: name.trim(),
        players: playerList.length > 0 ? playerList : undefined,
        didTutorial,
        startingKeywords: startingKeywords.length > 0 ? startingKeywords : undefined,
      });
      await refreshCampaigns();
      setActiveCampaignId(campaign.id);
      resetForm();
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(id: string) {
    await completeCampaign(id);
    await refreshCampaigns();
  }

  if (loading) return <p className="muted">Cargando campañas...</p>;

  return (
    <section className="page">
      <header className="page-header">
        <h1>Campañas</h1>
        <p className="page-description">
          Cada partida es independiente. El conocimiento descubierto se conserva,
          pero el mapa empieza sin explorar.
        </p>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <form className="card form-card" onSubmit={handleCreate}>
        <h2>Nueva campaña</h2>

        <label>
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Campaña #1"
          />
        </label>

        <label>
          Jugadores
          <input
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            placeholder="Ana, Ramón, Luis..."
          />
        </label>
        <p className="field-hint">Separa los nombres con comas.</p>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={didTutorial}
            onChange={(e) => setDidTutorial(e.target.checked)}
          />
          Hicimos el tutorial
        </label>

        <fieldset className="fieldset">
          <legend>Palabras clave iniciales (2)</legend>
          <p className="field-hint">
            Sleeping Gods empieza con dos palabras clave, vengan del tutorial o
            no. Regístralas aquí.
          </p>
          <label>
            Palabra 1
            <input
              value={keyword1}
              onChange={(e) => setKeyword1(e.target.value.toUpperCase())}
              placeholder="RATON"
            />
          </label>
          <label>
            Palabra 2
            <input
              value={keyword2}
              onChange={(e) => setKeyword2(e.target.value.toUpperCase())}
              placeholder="FALCON"
            />
          </label>
        </fieldset>

        <button
          type="submit"
          className="btn primary btn-block"
          disabled={creating || !name.trim()}
        >
          {creating ? 'Creando...' : 'Crear campaña'}
        </button>
      </form>

      <div className="card">
        <h2>Historial</h2>
        {campaigns.length === 0 ? (
          <p className="muted">Aún no hay campañas registradas.</p>
        ) : (
          <ul className="list">
            {campaigns.map((campaign) => {
              const campaignPlayers = parseCampaignPlayers(campaign);
              const startingKeywords = getStartingKeywords(campaign);

              return (
                <li key={campaign.id} className="list-item">
                  <div>
                    <strong>{campaign.name}</strong>
                    <p className="muted">
                      {campaign.status === 'ACTIVE' ? 'Activa' : 'Terminada'} ·{' '}
                      {new Date(campaign.startedAt).toLocaleDateString()}
                      {campaign.didTutorial ? ' · Tutorial' : ''}
                    </p>
                    {campaignPlayers.length > 0 && (
                      <p className="campaign-meta">
                        👥 {campaignPlayers.join(', ')}
                      </p>
                    )}
                    {startingKeywords.length > 0 && (
                      <p className="campaign-meta">
                        🔑 {startingKeywords.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="list-actions">
                    <button
                      type="button"
                      className={
                        activeCampaignId === campaign.id
                          ? 'btn primary'
                          : 'btn secondary'
                      }
                      onClick={() => setActiveCampaignId(campaign.id)}
                    >
                      {activeCampaignId === campaign.id ? 'Activa' : 'Seleccionar'}
                    </button>
                    {campaign.status === 'ACTIVE' && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => handleComplete(campaign.id)}
                      >
                        Terminar
                      </button>
                    )}
                    <Link className="btn link" to={`/campaigns/${campaign.id}`}>
                      Ver resumen
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
