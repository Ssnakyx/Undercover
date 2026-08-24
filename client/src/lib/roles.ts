// Aperçu client de la répartition des rôles — CONTRACT.md §2, dupliqué depuis
// server/src/game/roles.ts (computeRoleCounts) pour l'affichage en lobby avant
// le lancement. Le serveur reste l'unique source de vérité pour l'assignation
// réelle ; ce calcul ne sert qu'à prévisualiser les badges "N Civils / ...".

export interface RoleDistributionCounts {
  undercover: number;
  mrWhite: number;
  civils: number;
}

export function computeRoleCounts(n: number, mrWhiteRequested: boolean): RoleDistributionCounts {
  if (!Number.isInteger(n) || n < 3) {
    return { undercover: 0, mrWhite: 0, civils: Math.max(n, 0) };
  }

  let undercover: number;
  let mrWhiteAvailable: boolean;

  if (n <= 4) {
    undercover = 1;
    mrWhiteAvailable = false;
  } else if (n <= 8) {
    undercover = 1;
    mrWhiteAvailable = true;
  } else {
    undercover = 2;
    mrWhiteAvailable = true;
  }

  const mrWhite = mrWhiteAvailable && mrWhiteRequested ? 1 : 0;
  const civils = n - undercover - mrWhite;

  return { undercover, mrWhite, civils };
}

export function isMrWhiteAvailable(n: number): boolean {
  return n >= 5;
}
