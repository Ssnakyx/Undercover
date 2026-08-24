import type { CSSProperties } from 'react';
import { avatarColors, avatarInitial } from '../lib/avatar';

interface AvatarProps {
  seed: string;
  name: string;
  size?: 'md' | 'lg';
  host?: boolean;
  className?: string;
}

export function Avatar({ seed, name, size = 'md', host = false, className }: AvatarProps) {
  const { c1, c2 } = avatarColors(seed);
  const classes = ['avatar', size === 'lg' ? 'avatar--lg' : '', host ? 'avatar--host' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={classes}
      style={{ '--avatar-c1': c1, '--avatar-c2': c2 } as CSSProperties}
      aria-hidden="true"
    >
      {avatarInitial(name)}
    </span>
  );
}
