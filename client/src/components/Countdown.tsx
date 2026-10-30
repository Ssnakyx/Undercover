import { useEffect, useState } from 'react';

interface CountdownProps {
  deadline: number | null;
  /** Durée totale de la phase en ms, pour la jauge circulaire. */
  totalMs: number;
  size?: 'sm' | 'md';
}

const R = 26;
const CIRC = 2 * Math.PI * R;

/** Compte à rebours circulaire basé sur phaseDeadline (le serveur fait autorité). */
export function Countdown({ deadline, totalMs, size = 'md' }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;
  const left = Math.max(0, deadline - now);
  const seconds = Math.ceil(left / 1000);
  const ratio = Math.min(1, left / totalMs);
  const label = seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `${seconds}`;

  return (
    <div className={`countdown${size === 'sm' ? ' countdown--sm' : ''}${seconds <= 10 ? ' countdown--urgent' : ''}`} role="timer" aria-label={`${seconds} secondes restantes`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="countdown__track" cx="32" cy="32" r={R} />
        <circle className="countdown__bar" cx="32" cy="32" r={R} strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - ratio)} />
      </svg>
      <span className="countdown__value">{label}</span>
    </div>
  );
}
