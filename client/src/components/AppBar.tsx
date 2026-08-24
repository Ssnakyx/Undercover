import type { ReactNode } from 'react';

interface AppBarProps {
  title: string;
  right?: ReactNode;
}

export function AppBar({ title, right }: AppBarProps) {
  return (
    <header className="app-bar">
      <svg className="icon" viewBox="0 0 40 40" fill="none" aria-hidden="true" width={20} height={20} style={{ color: 'var(--color-gold-500)' }}>
        <polygon points="10,0 30,0 40,20 30,40 10,40 0,20" stroke="currentColor" strokeWidth="3" />
      </svg>
      <span className="app-bar__title">{title}</span>
      <span className="spacer" />
      {right}
    </header>
  );
}
