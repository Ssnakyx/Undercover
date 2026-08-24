import { useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { isUniverse, universeCopy } from '../lib/universe';

const CODE_LENGTH = 5;

export function Home() {
  const { createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();
  const { universe: universeParam } = useParams();

  const [mode, setMode] = useState<'create' | 'join'>('create');

  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [joinName, setJoinName] = useState('');
  const [codeCells, setCodeCells] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isUniverse(universeParam)) {
    return <Navigate to="/" replace />;
  }
  const universe = universeParam;
  const copy = universeCopy(universe);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await createRoom(createName.trim(), universe);
    setCreating(false);
    if (res.ok && res.roomCode) {
      navigate(`/room/${res.roomCode}`);
    } else {
      setCreateError(res.error?.message ?? 'Impossible de créer la partie.');
    }
  }

  function handleCellChange(index: number, value: string) {
    const char = value.slice(-1).toUpperCase();
    setCodeCells((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < CODE_LENGTH - 1) {
      cellRefs.current[index + 1]?.focus();
    }
  }

  function handleCellKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !codeCells[index] && index > 0) {
      cellRefs.current[index - 1]?.focus();
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const code = codeCells.join('');
    if (code.length !== CODE_LENGTH || !joinName.trim()) return;
    setJoining(true);
    setJoinError(null);
    const res = await joinRoom(code, joinName.trim());
    setJoining(false);
    if (res.ok) {
      navigate(`/room/${code}`);
    } else {
      setJoinError(res.error?.message ?? 'Impossible de rejoindre cette partie.');
    }
  }

  return (
    <div className="screen">
      <main className="main">
        <div className="container">
          <div className="hero">
            <svg className="hero__crest" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" stroke="currentColor" strokeWidth="2" />
              <polygon points="20,9 31,20 20,31 9,20" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
              <circle cx="20" cy="20" r="2.2" fill="currentColor" />
            </svg>
            <h1 className="hero__title font-display">{copy.name}</h1>
            <p className="hero__tagline">{copy.tagline}</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Mode de connexion">
            <button
              type="button"
              className="segmented__btn"
              role="tab"
              aria-selected={mode === 'create'}
              onClick={() => setMode('create')}
            >
              Créer une partie
            </button>
            <button
              type="button"
              className="segmented__btn"
              role="tab"
              aria-selected={mode === 'join'}
              onClick={() => setMode('join')}
            >
              Rejoindre
            </button>
          </div>

          <div className="panels">
            {mode === 'create' ? (
              <form className="stack" style={{ '--stack-gap': 'var(--space-5)' } as CSSProperties} onSubmit={handleCreate}>
                <div className="field">
                  <label className="field__label" htmlFor="create-name">
                    {copy.nameLabel}
                  </label>
                  <input
                    className="input"
                    id="create-name"
                    type="text"
                    maxLength={18}
                    placeholder={copy.namePlaceholder}
                    autoComplete="off"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                  <span className="field__hint">Visible par tous les joueurs de la room. 18 caractères max.</span>
                  {createError && <span className="field__hint field__hint--error">{createError}</span>}
                </div>
                <button className="btn btn-primary" type="submit" disabled={creating || !createName.trim()}>
                  {creating ? 'Création…' : 'Créer la partie'}
                </button>
              </form>
            ) : (
              <form className="stack" style={{ '--stack-gap': 'var(--space-5)' } as CSSProperties} onSubmit={handleJoin}>
                <div className="field">
                  <label className="field__label" htmlFor="code-0">
                    Code de la room
                  </label>
                  <div className="code-input-group" role="group" aria-label="Code à 5 caractères">
                    {codeCells.map((char, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          cellRefs.current[i] = el;
                        }}
                        id={i === 0 ? 'code-0' : undefined}
                        className="code-input-group__cell"
                        maxLength={1}
                        inputMode="text"
                        aria-label={`Caractère ${i + 1}`}
                        value={char}
                        onChange={(e) => handleCellChange(i, e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(i, e)}
                      />
                    ))}
                  </div>
                  <span className="field__hint">
                    Demande le code à l'hôte de la partie (5 caractères, sans 0/O/1/I).
                  </span>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="join-name">
                    {copy.nameLabel}
                  </label>
                  <input
                    className="input"
                    id="join-name"
                    type="text"
                    maxLength={18}
                    placeholder={copy.namePlaceholder}
                    autoComplete="off"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                  />
                  {joinError && <span className="field__hint field__hint--error">{joinError}</span>}
                </div>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={joining || codeCells.join('').length !== CODE_LENGTH || !joinName.trim()}
                >
                  {joining ? 'Connexion…' : 'Rejoindre la partie'}
                </button>
              </form>
            )}
          </div>

          <p className="footnote">
            Aucun compte requis — un pseudo suffit. Jouable à 3–12, sur mobile comme sur ordinateur.
            <br />
            <Link to="/">Changer d'univers</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
