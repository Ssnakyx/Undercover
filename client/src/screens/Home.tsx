import { useRef, useState, type CSSProperties, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRoom } from '../socket/RoomProvider';
import { isUniverse, universeCopy } from '../lib/universe';
import { loadPseudo, savePseudo } from '../lib/session';
import { AppBar } from '../components/AppBar';

const CODE_LENGTH = 5;
const PSEUDO_MAX_LENGTH = 18;

/** Extrait un code de room d'une saisie libre : code nu, lien d'invitation complet, espaces... */
function extractCode(raw: string): string {
  const fromLink = raw.match(/[?&]code=([A-Za-z0-9]+)/)?.[1] ?? raw.match(/\/room\/([A-Za-z0-9]+)/)?.[1];
  return (fromLink ?? raw).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

function toCells(code: string): string[] {
  return Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');
}

// Un lien d'invitation (voir Lobby "Partager") pointe vers /play/:universe?code=XXXXX : préremplit
// le code et bascule directement sur l'onglet "Rejoindre".
export function Home() {
  const { createRoom, joinRoom, joinAsSpectator } = useRoom();
  const navigate = useNavigate();
  const { universe: universeParam } = useParams();
  const [searchParams] = useSearchParams();
  const invitedCode = searchParams.get('code');

  const [mode, setMode] = useState<'create' | 'join'>(invitedCode ? 'join' : 'create');
  const [pseudo, setPseudo] = useState(() => loadPseudo());
  const [busy, setBusy] = useState<'create' | 'join' | 'spectate' | null>(null);
  const [error, setError] = useState<{ message: string; code: string | null } | null>(null);
  const [codeCells, setCodeCells] = useState<string[]>(() => toCells(extractCode(invitedCode ?? '')));
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isUniverse(universeParam)) {
    return <Navigate to="/" replace />;
  }
  const universe = universeParam;
  const copy = universeCopy(universe);
  const code = codeCells.join('');
  const pseudoOk = pseudo.trim().length > 0;

  function updatePseudo(value: string) {
    setPseudo(value);
    savePseudo(value);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!pseudoOk) return;
    setBusy('create');
    setError(null);
    const res = await createRoom(pseudo.trim(), universe);
    setBusy(null);
    if (res.ok && res.roomCode) navigate(`/room/${res.roomCode}`, { viewTransition: true });
    else setError({ message: res.error?.message ?? 'Impossible de créer la partie.', code: res.error?.code ?? null });
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || !pseudoOk) return;
    setBusy('join');
    setError(null);
    const res = await joinRoom(code, pseudo.trim());
    setBusy(null);
    if (res.ok) navigate(`/room/${code}`, { viewTransition: true });
    else setError({ message: res.error?.message ?? 'Impossible de rejoindre cette partie.', code: res.error?.code ?? null });
  }

  // Partie déjà lancée : proposer de regarder — le spectateur devient joueur à la partie suivante.
  async function handleSpectate() {
    if (code.length !== CODE_LENGTH || !pseudoOk) return;
    setBusy('spectate');
    const res = await joinAsSpectator(code, pseudo.trim());
    setBusy(null);
    if (res.ok) navigate(`/room/${code}`, { viewTransition: true });
    else setError({ message: res.error?.message ?? 'Impossible de regarder cette partie.', code: res.error?.code ?? null });
  }

  function setCode(next: string, focusIndex?: number) {
    setCodeCells(toCells(next));
    if (focusIndex !== undefined) cellRefs.current[Math.min(focusIndex, CODE_LENGTH - 1)]?.focus();
  }

  function handleCellChange(index: number, value: string) {
    const clean = extractCode(value);
    if (clean.length > 1) {
      // Saisie multiple (autocomplétion, collage sans événement paste) : remplit à partir d'ici.
      const next = (code.slice(0, index) + clean).slice(0, CODE_LENGTH);
      setCode(next, next.length);
      return;
    }
    const cells = [...codeCells];
    cells[index] = clean;
    setCodeCells(cells);
    if (clean && index < CODE_LENGTH - 1) cellRefs.current[index + 1]?.focus();
  }

  function handleCellKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !codeCells[index] && index > 0) cellRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) cellRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) cellRefs.current[index + 1]?.focus();
  }

  // Coller un code ou un lien d'invitation complet dans n'importe quelle case remplit tout.
  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = extractCode(e.clipboardData.getData('text'));
    if (!pasted) return;
    e.preventDefault();
    setCode(pasted, pasted.length);
  }

  const pseudoField = (id: string) => (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {copy.nameLabel}
      </label>
      <input
        className="input"
        id={id}
        type="text"
        maxLength={PSEUDO_MAX_LENGTH}
        placeholder={copy.namePlaceholder}
        autoComplete="nickname"
        value={pseudo}
        onChange={(e) => updatePseudo(e.target.value)}
      />
      <span className="field__hint">Visible par tous. Mémorisé sur cet appareil.</span>
    </div>
  );

  return (
    <div className="screen" data-universe={universe}>
      <AppBar
        title={copy.name}
        right={
          <Link to="/" className="btn btn-ghost btn-sm" viewTransition>
            ← Univers
          </Link>
        }
      />
      <main className="main">
        <div className="container stack" style={{ '--gap': '20px' } as CSSProperties}>
          <div className="logo" style={{ paddingTop: 4 }}>
            <div className="eyebrow">{copy.franchise}</div>
            <h1 className="logo__title" style={{ fontSize: 'clamp(2.2rem, 10vw, 3.4rem)' }}>
              {copy.name}
            </h1>
            <p className="logo__tagline">{copy.tagline}</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Créer ou rejoindre">
            <button type="button" className="segmented__btn" role="tab" aria-selected={mode === 'create'} onClick={() => setMode('create')}>
              Créer
            </button>
            <button type="button" className="segmented__btn" role="tab" aria-selected={mode === 'join'} onClick={() => setMode('join')}>
              Rejoindre
            </button>
          </div>

          <div className="hud-frame">
            {mode === 'create' ? (
              <form className="stack" onSubmit={handleCreate}>
                {pseudoField('create-name')}
                {error && <p className="field__error">{error.message}</p>}
                <button className="btn btn-primary" type="submit" disabled={busy !== null || !pseudoOk}>
                  {busy === 'create' ? 'Création…' : '▶ Créer la partie'}
                </button>
              </form>
            ) : (
              <form className="stack" onSubmit={handleJoin}>
                <div className="field">
                  <label className="field__label" htmlFor="code-0">
                    Code de la room
                  </label>
                  <div className="code-cells" role="group" aria-label="Code à 5 caractères">
                    {codeCells.map((char, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          cellRefs.current[i] = el;
                        }}
                        id={i === 0 ? 'code-0' : undefined}
                        className="code-cell"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        aria-label={`Caractère ${i + 1}`}
                        value={char}
                        onChange={(e) => handleCellChange(i, e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(i, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                      />
                    ))}
                  </div>
                  <span className="field__hint">
                    {invitedCode ? "Code pré-rempli depuis ton lien d'invitation." : 'Demande le code à l’hôte, ou colle directement son lien.'}
                  </span>
                </div>
                {pseudoField('join-name')}
                {error && <p className="field__error">{error.message}</p>}
                <button className="btn btn-primary" type="submit" disabled={busy !== null || code.length !== CODE_LENGTH || !pseudoOk}>
                  {busy === 'join' ? 'Connexion…' : '▶ Rejoindre'}
                </button>
                {error?.code === 'GAME_IN_PROGRESS' && (
                  <button className="btn btn-secondary" type="button" disabled={busy !== null || !pseudoOk} onClick={handleSpectate}>
                    {busy === 'spectate' ? 'Connexion…' : '👁 Regarder en spectateur'}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
