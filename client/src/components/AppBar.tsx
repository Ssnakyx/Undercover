import type { ReactNode } from 'react';

interface AppBarProps {
  title: string;
  right?: ReactNode;
}

/** Barre haute façon HUD de jeu : logo, titre de la phase, actions à droite. */
export function AppBar({ title, right }: AppBarProps) {
  return (
    <header className="hud">
      <svg className="hud__logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <use href="#logo-mark" />
      </svg>
      <span className="hud__title">{title}</span>
      {right && <div className="hud__right">{right}</div>}
    </header>
  );
}
