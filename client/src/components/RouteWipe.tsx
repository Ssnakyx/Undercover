import { useLocation } from 'react-router-dom';

/**
 * Fin du volet blanc de l'écran titre : quand on arrive d'un choix d'univers (navigation avec
 * state.wipe, voir screens/MainMenu.tsx), l'écran blanc se retire en biais vers la droite pour
 * découvrir la nouvelle page (styles/metaphor.css, .route-wipe).
 */
export function RouteWipe() {
  const location = useLocation();
  const wipe = (location.state as { wipe?: boolean } | null)?.wipe;
  if (!wipe) return null;
  return <div key={location.key} className="route-wipe" aria-hidden="true" />;
}
