import { useState, type CSSProperties } from 'react';
import type { Universe } from '../types';
import { avatarColors } from '../lib/avatar';

interface CharacterArtProps {
  name: string | null | undefined;
  image?: string | null;
  universe?: Universe;
  className?: string;
}

/**
 * Image d'un personnage (ou jaquette typographique quand il n'y en a pas : univers Jeux vidéo,
 * paire maison, image introuvable). Le dégradé de la jaquette est déterministe par nom pour que
 * le même jeu ait toujours la même couleur.
 */
export function CharacterArt({ name, image, universe, className }: CharacterArtProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!image && failedSrc !== image;
  const { c1, c2 } = avatarColors(name ?? '?');
  return (
    <div
      className={['char-art', className].filter(Boolean).join(' ')}
      data-universe={universe}
      style={{ '--fallback-c1': c1, '--fallback-c2': c2 } as CSSProperties}
    >
      {showImage ? (
        <img src={image} alt={name ?? ''} loading="lazy" draggable={false} onError={() => setFailedSrc(image)} />
      ) : (
        <div className="char-art__fallback" aria-label={name ?? undefined}>
          <span>{name ?? '?'}</span>
        </div>
      )}
    </div>
  );
}
