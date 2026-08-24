import type { ReactNode } from 'react';

export function ActionBar({ children }: { children: ReactNode }) {
  return <footer className="action-bar">{children}</footer>;
}
