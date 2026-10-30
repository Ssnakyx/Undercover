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
      return `Décris ${word} sans jamais le nommer. Repère les indices qui sonnent faux : certains joueurs n'ont pas le même ${unit} que toi.`;
    case 'undercover':
      return `Les autres ont un ${unit} proche du tien. Fonds-toi dans la masse sans te trahir.`;
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
        <span className="role-card__role">
          <RoleEmblem role={role} />
          {roleLabel(role)}
        </span>
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
              Tu ne connais pas le {unit} des autres. Écoute, bluffe, et si tu es démasqué, devine-le pour gagner quand même.
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
        {role === 'undercover' && <p className="role-card__secret">🤫 Rôle secret — ne le révèle à personne.</p>}
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
