import { useEffect, useState } from 'react';

// Ne s'applique qu'aux écrans "papier" (Menu/Home/Lobby/GameOver, voir tokens.css
// .theme-paper) — les écrans de partie restent en encre quel que soit ce réglage : ce n'est
// pas un mode clair/sombre générique, c'est une préférence sur le monde "avant/après la
// partie" (voir CONTRACT.md §8). Persisté indépendamment de toute room, comme le pseudo.
const STORAGE_KEY = 'lolcover:theme';

function readStoredTheme(): 'light' | 'dark' | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : null;
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = readStoredTheme();
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <button
      type="button"
      className={['icon-btn', 'theme-toggle', className].filter(Boolean).join(' ')}
      onClick={toggle}
      aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" fill="none" className="icon" aria-hidden="true">
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
          <line x1="12" y1="2.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="2.5" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="19" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="4.9" y1="4.9" x2="6.6" y2="6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="17.4" y1="17.4" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="4.9" y1="19.1" x2="6.6" y2="17.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="17.4" y1="6.6" x2="19.1" y2="4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
