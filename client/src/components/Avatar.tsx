import type { CSSProperties } from 'react';
import { avatarColors, avatarInitial } from '../lib/avatar';

interface AvatarProps {
  seed: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  host?: boolean;
  dead?: boolean;
  className?: string;
}

export function Avatar({ seed, name, size = 'md', host = false, dead = false, className }: AvatarProps) {
  const { c1, c2, text } = avatarColors(seed);
  const classes = ['avatar', size !== 'md' ? `avatar--${size}` : '', dead ? 'avatar--dead' : '', className]
    .filter(Boolean)
    .join(' ');
  const avatar = (
    <span className={classes} style={{ '--avatar-c1': c1, '--avatar-c2': c2, '--avatar-text': text } as CSSProperties} aria-hidden="true">
      {avatarInitial(name)}
    </span>
  );
  if (!host) return avatar;
  return (
    <span className="avatar-wrap">
      {avatar}
      <svg className="avatar-crown" viewBox="0 0 24 24" fill="currentColor" aria-label="Hôte">
        <path d="M3 18 L5 7 L10 12 L12 5 L14 12 L19 7 L21 18 Z" />
      </svg>
    </span>
  );
}
