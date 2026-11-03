import type { CSSProperties } from 'react';
import { avatarColors, avatarInitial } from '../lib/avatar';
import { accountPhotoUrl } from '../lib/account';
import type { PublicAccountTag } from '../types';

interface AvatarProps {
  seed: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  host?: boolean;
  dead?: boolean;
  className?: string;
  /** Compte joueur rattaché : sa photo remplace l'initiale dans la gemme. */
  account?: Pick<PublicAccountTag, 'id' | 'photoVersion'> | null;
}

export function Avatar({ seed, name, size = 'md', host = false, dead = false, className, account }: AvatarProps) {
  const photo = accountPhotoUrl(account);
  const { c1, c2, text } = avatarColors(seed);
  const classes = ['avatar', size !== 'md' ? `avatar--${size}` : '', dead ? 'avatar--dead' : '', className]
    .filter(Boolean)
    .join(' ');
  const avatar = (
    <span className={classes} style={{ '--avatar-c1': c1, '--avatar-c2': c2, '--avatar-text': text } as CSSProperties} aria-hidden="true">
      {photo ? <img className="avatar__photo" src={photo} alt="" loading="lazy" /> : avatarInitial(name)}
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
