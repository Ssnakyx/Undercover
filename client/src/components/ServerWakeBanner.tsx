import { useEffect, useState } from 'react';
import { useRoom } from '../socket/RoomProvider';

/** Délai avant d'afficher le bandeau : une connexion normale s'établit bien plus vite. */
const SHOW_AFTER_MS = 2500;

/**
 * Bandeau affiché tant que le client n'arrive pas à joindre le serveur. Sur l'offre gratuite
 * de Render, le serveur s'endort après un moment sans visite et met jusqu'à une minute à
 * redémarrer : sans ce message, le site paraît simplement cassé.
 */
export function ServerWakeBanner() {
  const { connected } = useRoom();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (connected) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, [connected]);

  if (!visible) return null;
  return (
    <div className="wake-banner" role="status" aria-live="polite">
      <span className="wake-banner__dot" aria-hidden="true" />
      <span>
        Connexion au serveur… S’il dormait, il se réveille : ça peut prendre jusqu’à une minute.
      </span>
    </div>
  );
}
