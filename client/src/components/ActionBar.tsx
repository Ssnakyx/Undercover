import type { ReactNode } from 'react';

export function ActionBar({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <footer className="action-bar">
      <div className="action-bar__inner">
        {children}
        {hint && <p className="action-hint">{hint}</p>}
      </div>
    </footer>
  );
}
