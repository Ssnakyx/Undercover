import type { Universe } from '../types';

// Textes spécifiques à chaque univers de contenu (CONTRACT.md §0/§7) — même moteur de jeu,
// vocabulaire adapté (aucun asset visuel officiel dans les deux cas).
export interface UniverseCopy {
  universe: Universe;
  name: string;
  tagline: string;
  unitLabel: string; // "champion" / "combattant" — utilisé dans les instructions de jeu
  nameLabel: string; // libellé du champ pseudo
  namePlaceholder: string;
}

const COPY: Record<Universe, UniverseCopy> = {
  lol: {
    universe: 'lol',
    name: 'lolCover',
    tagline:
      "Un traître se cache dans l'équipe. Décrivez votre champion sans le nommer, et démasquez les intrus avant la fin de la partie.",
    unitLabel: 'champion',
    nameLabel: "Ton pseudo d'invocateur",
    namePlaceholder: 'ex. NoctaJungle',
  },
  smash: {
    universe: 'smash',
    name: 'SmashCover',
    tagline:
      "Un traître se cache dans l'équipe. Décrivez votre combattant sans le nommer, et démasquez les intrus avant la fin de la partie.",
    unitLabel: 'combattant',
    nameLabel: 'Ton pseudo de smasher',
    namePlaceholder: 'ex. FalconPunch_',
  },
};

export function universeCopy(universe: Universe): UniverseCopy {
  return COPY[universe];
}

export function isUniverse(value: string | undefined): value is Universe {
  return value === 'lol' || value === 'smash';
}
