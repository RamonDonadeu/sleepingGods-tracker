import { useCallback, useEffect, useRef, useState } from 'react';

import { Link, useParams } from 'react-router-dom';

import { getLocationState } from '../api/locations';

import {

  addAccess,

  addMandatoryEvent,

  addOption,

  deleteEntry,

  getStructuredKnowledge,

  markVisited,

  type StructuredEntry,

  type StructuredKnowledge,

} from '../api/knowledge';

import { PathDiagram } from '../components/PathDiagram';

import { OptionForm } from '../components/OptionForm';

import {
  isStatChallengeFormValid,
  StatChallengeForm,
  toStatChallengePayload,
} from '../components/StatChallengeForm';

import { EMPTY_STAT_CHALLENGE_FORM } from '../types/statChallenge';

import {
  EMPTY_OPTION_FORM,
  isOptionFormValid,
  toOptionPayload,
} from '../types/option';

import { useCampaign } from '../context/CampaignContext';

import type { LocationCampaignState } from '../types';

import {

  formatFailureOutcome,

  formatStatChallengeSummary,

  formatSuccessOutcome,

} from '../utils/statChallenge';

import { formatBranchEntry, formatOutcomeEntry } from '../utils/gameEffects';



type Tab = 'diagram' | 'edit';



function isLocationEmpty(knowledge: StructuredKnowledge): boolean {

  return (

    knowledge.access.length === 0 &&

    knowledge.mandatory.length === 0 &&

    knowledge.options.length === 0 &&

    knowledge.rewards.length === 0 &&

    knowledge.other.length === 0

  );

}



function formatChallengeEntry(entry: StructuredEntry): string {

  const meta = entry.metadata;

  const lines = [formatStatChallengeSummary(meta)];

  if (meta?.success) {
    lines.push(`✓ ${formatBranchEntry(meta.success)}`);
  } else {
    const success = formatSuccessOutcome(meta);
    if (success) lines.push(success);
  }

  if (meta?.failure) {
    lines.push(`✗ ${formatBranchEntry(meta.failure)}`);
  } else {
    const failure = formatFailureOutcome(meta);
    if (failure) lines.push(failure);
  }

  return lines.join(' · ');

}



function formatMandatoryEvent(entry: StructuredEntry): string {

  const meta = entry.metadata;



  if (meta?.eventKind === 'STAT_TEST') {

    return formatChallengeEntry(entry);

  }

  if (meta?.eventKind === 'COMBAT') {

    return meta.description

      ? `Combate obligatorio: ${meta.description}`

      : 'Combate obligatorio';

  }

  return meta?.description || entry.content;

}



function formatOptionEntry(entry: StructuredEntry): string {

  if (entry.type === 'OPTION_STAT_TEST') {

    return formatChallengeEntry(entry);

  }

  if (entry.type === 'OPTION_TOTEM' || entry.type === 'TOTEM') {
    const name = entry.metadata?.totemName ?? entry.content;
    return `🗿 Ganas tótem: ${name}`;
  }

  if (entry.type === 'OPTION_GOTO') {
    return formatBranchEntry(entry.metadata) || entry.content;
  }

  if (entry.type === 'OPTION_REWARD' || entry.type === 'REWARD') {
    return formatOutcomeEntry(entry.metadata);
  }

  if (entry.type === 'FAILURE_LOCATION') {

    return entry.content;

  }

  return entry.content;

}



export function LocationPage() {

  const { id } = useParams();

  const { activeCampaign } = useCampaign();

  const [state, setState] = useState<LocationCampaignState | null>(null);

  const [knowledge, setKnowledge] = useState<StructuredKnowledge | null>(null);

  const [tab, setTab] = useState<Tab>('diagram');

  const [loading, setLoading] = useState(true);

  const initialTabSetFor = useRef<string | null>(null);



  const [accessKeyword, setAccessKeyword] = useState('');

  const [accessDest, setAccessDest] = useState('');

  const [optionForm, setOptionForm] = useState(EMPTY_OPTION_FORM);

  const [mandatoryKind, setMandatoryKind] = useState<'STAT_TEST' | 'COMBAT' | 'TEXT'>(

    'STAT_TEST',

  );

  const [mandatoryChallenge, setMandatoryChallenge] = useState(

    EMPTY_STAT_CHALLENGE_FORM,

  );

  const [mandatoryDescription, setMandatoryDescription] = useState('');



  const load = useCallback(async () => {

    if (!id || !activeCampaign) return;

    setLoading(true);

    await markVisited(activeCampaign.id, id).catch(() => undefined);

    const [locState, knowledgeData] = await Promise.all([

      getLocationState(id, activeCampaign.id),

      getStructuredKnowledge(activeCampaign.id, id),

    ]);

    setState(locState);

    setKnowledge(knowledgeData);

    setLoading(false);

  }, [id, activeCampaign]);



  useEffect(() => {

    void load();

  }, [load]);



  useEffect(() => {

    if (!id || loading || !knowledge || initialTabSetFor.current === id) return;

    initialTabSetFor.current = id;

    setTab(isLocationEmpty(knowledge) ? 'edit' : 'diagram');

  }, [id, loading, knowledge]);



  const isVisited = state?.campaignStatus !== 'NOT_VISITED';

  const hasDiagram = (knowledge?.diagram.length ?? 0) > 0;



  async function handleAddAccess(event: React.FormEvent) {

    event.preventDefault();

    if (!id || !activeCampaign) return;

    await addAccess(activeCampaign.id, id, {

      keyword: accessKeyword,

      destination: accessDest.trim(),

    });

    setAccessKeyword('');

    setAccessDest('');

    await load();

  }



  async function handleAddMandatoryEvent(event: React.FormEvent) {

    event.preventDefault();

    if (!id || !activeCampaign) return;



    if (mandatoryKind === 'STAT_TEST') {

      await addMandatoryEvent(activeCampaign.id, id, {

        eventKind: 'STAT_TEST',

        ...toStatChallengePayload(mandatoryChallenge),

      });

      setMandatoryChallenge(EMPTY_STAT_CHALLENGE_FORM);

    } else {

      await addMandatoryEvent(activeCampaign.id, id, {

        eventKind: mandatoryKind,

        description: mandatoryDescription.trim(),

      });

      setMandatoryDescription('');

    }

    await load();

  }



  async function handleAddOption(event: React.FormEvent) {

    event.preventDefault();

    if (!id || !activeCampaign) return;



    await addOption(activeCampaign.id, id, toOptionPayload(optionForm));

    setOptionForm(EMPTY_OPTION_FORM);

    await load();

  }



  async function handleDelete(entryId: string) {

    await deleteEntry(entryId);

    await load();

  }



  if (!activeCampaign) {

    return (

      <section className="page">

        <p className="muted">Selecciona una campaña activa.</p>

      </section>

    );

  }



  if (loading || !state) return <p className="muted">Cargando...</p>;



  const statusLabel = {

    NOT_VISITED: '⚪ Sin visitar',

    VISITED: '🟢 Visitada',

    PENDING: '🟡 Pendiente',

  }[state.campaignStatus];



  const visibleOptions =

    knowledge?.options.filter((entry) => entry.type !== 'FAILURE_LOCATION') ?? [];

  const legacyRewards = knowledge?.rewards ?? [];

  const allOptions = [...visibleOptions, ...legacyRewards];



  return (

    <section className="page">

      <header className="page-header">

        <Link className="btn link back-link" to="/">

          ← Buscar

        </Link>

        <h1>#{state.location.number}</h1>

        <p className="page-description">{statusLabel}</p>

      </header>



      <div className="tab-bar">

        <button

          type="button"

          className={tab === 'diagram' ? 'tab active' : 'tab'}

          onClick={() => setTab('diagram')}

        >

          Caminos

        </button>

        <button

          type="button"

          className={tab === 'edit' ? 'tab active' : 'tab'}

          onClick={() => setTab('edit')}

        >

          Editar

        </button>

      </div>



      {tab === 'diagram' && (

        <div className="card diagram-card">

          <h2>Mapa de caminos</h2>

          {isVisited || hasDiagram ? (

            <PathDiagram nodes={knowledge?.diagram ?? []} />

          ) : (

            <p className="muted">

              Visita esta localización para ver el diagrama de caminos.

            </p>

          )}

        </div>

      )}



      {tab === 'edit' && (

        <>

          <div className="card">

            <h2>Accesos</h2>

            {knowledge?.access.length === 0 && (

              <p className="muted">Sin accesos registrados.</p>

            )}

            <ul className="entry-list">

              {knowledge?.access.map((entry) => (

                <li key={entry.id} className="entry-item">

                  <span>

                    Requiere <strong>{entry.metadata?.keyword}</strong> para ir a{' '}

                    <strong>#{entry.metadata?.destination}</strong>

                  </span>

                  <button

                    type="button"

                    className="btn-icon"

                    onClick={() => handleDelete(entry.id)}

                    aria-label="Eliminar"

                  >

                    ×

                  </button>

                </li>

              ))}

            </ul>



            <form className="inline-form-row" onSubmit={handleAddAccess}>

              <input

                placeholder="Palabra"

                value={accessKeyword}

                onChange={(e) => setAccessKeyword(e.target.value.toUpperCase())}

              />

              <input

                placeholder="34.1"

                value={accessDest}

                onChange={(e) => setAccessDest(e.target.value)}

              />

              <button

                type="submit"

                className="btn secondary"

                disabled={!accessKeyword || !accessDest}

              >

                Añadir

              </button>

            </form>

          </div>



          <details className="card collapsible-card">

            <summary className="collapsible-summary">

              <span className="collapsible-title">Eventos obligatorios</span>

              {(knowledge?.mandatory.length ?? 0) > 0 && (

                <span className="collapsible-badge">{knowledge?.mandatory.length}</span>

              )}

            </summary>

            <div className="collapsible-content">

              <p className="muted section-hint">

                Lo que ocurre al llegar antes de elegir (pruebas de habilidad, combate, etc.).

              </p>

              {knowledge?.mandatory.length === 0 && (

                <p className="muted">Sin eventos obligatorios registrados.</p>

              )}

              <ul className="entry-list">

                {knowledge?.mandatory.map((entry) => (

                  <li key={entry.id} className="entry-item">

                    <span>{formatMandatoryEvent(entry)}</span>

                    <button

                      type="button"

                      className="btn-icon"

                      onClick={() => handleDelete(entry.id)}

                      aria-label="Eliminar"

                    >

                      ×

                    </button>

                  </li>

                ))}

              </ul>



              <form className="form-card" onSubmit={handleAddMandatoryEvent}>

                <label>

                  Tipo de evento

                  <select

                    value={mandatoryKind}

                    onChange={(e) =>

                      setMandatoryKind(

                        e.target.value as 'STAT_TEST' | 'COMBAT' | 'TEXT',

                      )

                    }

                  >

                    <option value="STAT_TEST">Prueba de habilidad</option>

                    <option value="COMBAT">Combate</option>

                    <option value="TEXT">Otro evento</option>

                  </select>

                </label>

                {mandatoryKind === 'STAT_TEST' ? (

                  <StatChallengeForm
                    campaignId={activeCampaign.id}
                    value={mandatoryChallenge}
                    onChange={setMandatoryChallenge}
                  />

                ) : (

                  <label>

                    Descripción

                    <input

                      placeholder="Ej: enfrentamiento con guardias"

                      value={mandatoryDescription}

                      onChange={(e) => setMandatoryDescription(e.target.value)}

                    />

                  </label>

                )}

                <button

                  type="submit"

                  className="btn secondary btn-block"

                  disabled={

                    mandatoryKind === 'STAT_TEST'

                      ? !isStatChallengeFormValid(mandatoryChallenge)

                      : !mandatoryDescription.trim()

                  }

                >

                  Añadir evento obligatorio

                </button>

              </form>

            </div>

          </details>



          <div className="card">
            <h2>Opciones</h2>
            {allOptions.length === 0 && (
              <p className="muted">Sin opciones registradas.</p>
            )}
            <ul className="entry-list">
              {allOptions.map((entry) => (
                <li key={entry.id} className="entry-item">
                  <span>{formatOptionEntry(entry)}</span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <form className="form-card" onSubmit={handleAddOption}>
              <OptionForm
                campaignId={activeCampaign.id}
                value={optionForm}
                onChange={setOptionForm}
              />
              <button
                type="submit"
                className="btn secondary btn-block"
                disabled={!isOptionFormValid(optionForm)}
              >
                Añadir opción
              </button>
            </form>
          </div>

        </>

      )}

    </section>

  );

}


