import { useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { Avatar } from '../components/Avatar';
import { RoleEmblem } from '../components/RoleBadge';
import { useAccount } from '../socket/AccountProvider';
import { ApiError, fileToProfilePhoto, winRate, type AccountStats } from '../lib/account';
import { roleLabel } from '../lib/roleInfo';

const USERNAME_PATTERN = '[A-Za-z0-9_.\\-]{3,20}';

function errorText(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Une erreur est survenue, réessaie.';
}

// Connexion / création de compte. Le compte reste optionnel : on joue toujours avec un simple pseudo.
function AuthForm() {
  const { register, login } = useAccount();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(username.trim(), password);
      else await login(username.trim(), password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="logo" style={{ paddingTop: 4 }}>
        <div className="eyebrow">Facultatif</div>
        <h1 className="logo__title" style={{ fontSize: 'clamp(2.2rem, 10vw, 3.2rem)' }}>
          Ton grimoire
        </h1>
        <p className="logo__tagline">
          Crée un compte pour garder tes statistiques d’une soirée à l’autre et afficher ta photo à la table. Sans compte, tu joues exactement pareil.
        </p>
      </div>

      <div className="segmented" role="tablist" aria-label="Créer un compte ou se connecter">
        <button type="button" className="segmented__btn" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>
          Créer un compte
        </button>
        <button type="button" className="segmented__btn" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>
          Se connecter
        </button>
      </div>

      <form className="hud-frame stack" onSubmit={submit}>
        <div className="field">
          <label className="field__label" htmlFor="acc-username">
            Pseudo du compte
          </label>
          <input
            className="input"
            id="acc-username"
            type="text"
            maxLength={20}
            pattern={mode === 'register' ? USERNAME_PATTERN : undefined}
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {mode === 'register' && <span className="field__hint">3 à 20 caractères : lettres, chiffres, _ . -</span>}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="acc-password">
            Mot de passe
          </label>
          <input
            className="input"
            id="acc-password"
            type="password"
            minLength={mode === 'register' ? 6 : undefined}
            maxLength={128}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === 'register' && <span className="field__hint">6 caractères minimum. Pas de récupération par e-mail : note-le bien.</span>}
        </div>
        {error && <p className="field__error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Un instant…' : mode === 'register' ? 'Créer mon compte' : 'Me connecter'}
        </button>
      </form>
    </>
  );
}

function StatTiles({ stats }: { stats: AccountStats }) {
  const rate = winRate(stats);
  return (
    <div className="stat-tiles">
      <div className="stat-tile">
        <span className="stat-tile__value">{stats.played}</span>
        <span className="stat-tile__label">Parties</span>
      </div>
      <div className="stat-tile stat-tile--won">
        <span className="stat-tile__value">{stats.won}</span>
        <span className="stat-tile__label">Victoires</span>
      </div>
      <div className="stat-tile stat-tile--lost">
        <span className="stat-tile__value">{stats.lost}</span>
        <span className="stat-tile__label">Défaites</span>
      </div>
      <div className="stat-tile">
        <span className="stat-tile__value">{rate === null ? '–' : `${rate}%`}</span>
        <span className="stat-tile__label">Taux de victoire</span>
      </div>
    </div>
  );
}

function RoleStats({ stats }: { stats: AccountStats }) {
  // Rôles jamais joués en bas, les plus joués en haut.
  const rows = [...stats.byRole].sort((a, b) => b.played - a.played);
  return (
    <div className="role-stats">
      {rows.map((r) => {
        const rate = winRate(r);
        return (
          <div
            key={r.role}
            className={`role-stat${r.played === 0 ? ' role-stat--empty' : ''}`}
            style={{ '--role-color': `var(--role-${r.role})` } as CSSProperties}
          >
            <RoleEmblem role={r.role} className="role-stat__icon" />
            <div className="role-stat__body">
              <div className="role-stat__name">{roleLabel(r.role)}</div>
              <div className="role-stat__meta">
                {r.played === 0
                  ? 'Jamais joué'
                  : `${r.played} partie${r.played > 1 ? 's' : ''}, ${r.won} gagnée${r.won > 1 ? 's' : ''}, ${r.lost} perdue${r.lost > 1 ? 's' : ''}`}
              </div>
              <div className="role-stat__bar" aria-hidden="true">
                <span style={{ width: `${rate ?? 0}%` }} />
              </div>
            </div>
            <span className="role-stat__rate">{rate === null ? '' : `${rate}%`}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProfileView() {
  const { account, stats, logout, setPhoto, refresh } = useAccount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!account) return null;

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setPhoto(await fileToProfilePhoto(file));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setError(null);
    try {
      await setPhoto(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="profile-head">
        <button type="button" className="profile-head__photo" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Changer la photo de profil">
          <Avatar seed={account.id} name={account.username} account={account} size="xl" />
          <span className="profile-head__edit">{busy ? '…' : '✎'}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <div>
          <div className="eyebrow">Compte</div>
          <h1 className="profile-head__name">{account.username}</h1>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              {account.photoVersion > 0 ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            {account.photoVersion > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto} disabled={busy}>
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="field__error">{error}</p>}

      <section aria-labelledby="stats-title">
        <div className="section__head">
          <h2 id="stats-title" className="section__title">
            Statistiques
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
            Actualiser
          </button>
        </div>
        {stats ? <StatTiles stats={stats} /> : <p className="text-low small">Chargement…</p>}
        {stats && stats.played === 0 && (
          <p className="text-low small mt-4">Aucune partie pour l’instant. Rejoins une partie connecté à ce compte : chaque partie terminée est comptée ici.</p>
        )}
      </section>

      {stats && (
        <section aria-labelledby="roles-title">
          <div className="section__head">
            <h2 id="roles-title" className="section__title">
              Par rôle
            </h2>
          </div>
          <RoleStats stats={stats} />
        </section>
      )}

      <button type="button" className="btn btn-secondary" onClick={() => void logout()}>
        Se déconnecter
      </button>
    </>
  );
}

export function Profile() {
  const { status, refresh } = useAccount();

  return (
    <div className="screen" data-universe="games">
      <AppBar
        title="Mon compte"
        right={
          <Link to="/" className="btn btn-ghost btn-sm" viewTransition>
            ← Menu
          </Link>
        }
      />
      <main className="main">
        <div className="container stack" style={{ '--gap': '22px' } as CSSProperties}>
          {status === 'loading' && <p className="text-low">Chargement du compte…</p>}
          {status === 'offline' && (
            <div className="panel stack">
              <p>Le serveur ne répond pas encore (il se réveille peut-être après une pause).</p>
              <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
                Réessayer
              </button>
            </div>
          )}
          {status === 'guest' && <AuthForm />}
          {status === 'ready' && <ProfileView />}
        </div>
      </main>
    </div>
  );
}
