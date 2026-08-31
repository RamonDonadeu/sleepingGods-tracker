import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createKeyword, getKeywords } from '../api/keywords';
import type { Keyword } from '../types';

export function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getKeywords();
    setKeywords(data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newWord.trim()) return;
    await createKeyword(newWord.trim());
    setNewWord('');
    await load();
  }

  return (
    <section className="page">
      <header className="page-header">
        <h1>Palabras clave</h1>
        <p className="page-description">
          Colección global de palabras descubiertas en cualquier campaña.
        </p>
      </header>

      <form className="card form-card inline-form" onSubmit={handleCreate}>
        <div className="inline-fields">
          <label>
            Nueva palabra
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="RATON"
            />
          </label>
          <button type="submit" className="btn primary" disabled={!newWord.trim()}>
            Añadir
          </button>
        </div>
      </form>

      <div className="card">
        {loading ? (
          <p className="muted">Cargando...</p>
        ) : keywords.length === 0 ? (
          <p className="muted">Aún no hay palabras clave registradas.</p>
        ) : (
          <ul className="chip-list">
            {keywords.map((keyword) => (
              <li key={keyword.id}>
                <Link className="chip" to={`/keywords/${keyword.id}`}>
                  {keyword.word}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
