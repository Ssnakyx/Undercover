import type { RolePrivatePayload, Universe } from '../types';
import { roleLabel, roleHasWord } from '../lib/roleInfo';
import { universeCopy } from '../lib/universe';
import { CharacterArt } from './CharacterArt';
import { RoleEmblem } from './RoleBadge';

const SPY_TEAM_LABEL: Record<string, string> = {
  civils: 'est dans le camp des Civils',
  undercover: 'est Undercover',
  mrwhite: 'est Mr White',
  jester: 'est le Bouffon',
};

function instruction(role: RolePrivatePayload['role'], word: string, unit: string): string {
  switch (role) {
    case 'civil':
    case 'undercover':
      return `Décris ${word} sans jamais le nommer. Tout le monde n'a peut-être pas le même ${unit} que toi : écoute bien les autres.`;
    case 'spy':
      return `Camp des Civils. Décris ${word} comme eux, et sers-toi de ton info secrète.`;
    case 'protector':
      return `Camp des Civils. Une fois par partie, pendant un vote, protège un joueur : s'il est éliminé, il est sauvé.`;
    case 'ghost':
      return `Camp des Civils. Si tu es éliminé par un vote, tu pourras encore voter au round suivant.`;
    case 'hunter':
      return `Camp des Civils. Si tu es éliminé par un vote, tu emportes un joueur de ton choix avec toi.`;
    default:
      return '';
  }
}

// La carte ne dit pas si l'on est Civil, Undercover ou Mr White : elle montre juste le mot (ou
// l'absence de mot). Seuls les rôles spéciaux, qui ont un pouvoir à connaître, sont nommés.
const UNNAMED_ROLES = new Set<RolePrivatePayload['role']>(['civil', 'undercover', 'mrwhite']);

/** Dos de la carte de révélation (aussi affiché dans "Mon mot" pendant la partie). */
export function RoleCardContent({ myRole, universe }: { myRole: RolePrivatePayload | null; universe: Universe }) {
  if (!myRole) {
    return (
      <div className="role-card__body" style={{ margin: 'auto 0' }}>
        <p className="text-mid text-center">Distribution des rôles…</p>
      </div>
    );
  }
  const { role, champion, championImage, championDescription, loverName, spyInsight } = myRole;
  const unit = universeCopy(universe).unitLabel;
  const hasWord = roleHasWord(role) && !!champion;

  return (
    <>
      <div className="role-card__art">
        {!UNNAMED_ROLES.has(role) && (
          <span className="role-card__role">
            <RoleEmblem role={role} />
            {roleLabel(role)}
          </span>
        )}
        {hasWord ? (
          <CharacterArt name={champion} image={championImage} universe={universe} />
        ) : (
          <svg className="role-card__mystery-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <use href={`#role-${role}`} />
          </svg>
        )}
      </div>
      <div className="role-card__body">
        {hasWord ? (
          <>
            <div className="eyebrow">Ton {unit}</div>
            <div className="role-card__name">{champion}</div>
            {championDescription && <p className="role-card__desc">{championDescription}</p>}
            <p className="role-card__text">{instruction(role, champion!, unit)}</p>
          </>
        ) : role === 'mrwhite' ? (
          <>
            <div className="role-card__name">Aucun mot</div>
            <p className="role-card__text">
              Tu n'as pas de {unit} cette fois. Écoute les autres, bluffe, et si tu es démasqué, devine leur {unit} pour gagner quand même.
            </p>
          </>
        ) : (
          <>
            <div className="role-card__name">Fais-toi virer</div>
            <p className="role-card__text">
              Tu n'as aucun {unit} et aucun camp. Ton seul but : être éliminé par un vote. Si ça arrive, tu gagnes seul.
            </p>
          </>
        )}
        {spyInsight && (
          <p className="role-card__secret">
            🔍 Info secrète : <strong>{spyInsight.playerName}</strong> {SPY_TEAM_LABEL[spyInsight.team] ?? spyInsight.team}.
          </p>
        )}
        {loverName && (
          <p className="role-card__secret">
            💘 Tu es amoureux·se de <strong>{loverName}</strong>. Si l'un de vous est éliminé, l'autre le suit.
          </p>
        )}
      </div>
    </>
  );
}
