import { useEffect, useRef, type ReactNode } from 'react';

const MAX_TILT = 14; // degrés

/**
 * Incline son contenu comme une carte qu'on tient en main : suit le pointeur (souris ou doigt
 * posé) et, sur mobile, le gyroscope. Expose --rx/--ry (rotation) et --mx/--my (position du
 * reflet) aux descendants, que `.holo` utilise pour faire glisser l'irisation.
 */
export function HoloTilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    function apply(px: number, py: number) {
      // px, py dans [0, 1]
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el!.style.setProperty('--ry', `${(px - 0.5) * 2 * MAX_TILT}deg`);
        el!.style.setProperty('--rx', `${(0.5 - py) * 2 * MAX_TILT}deg`);
        el!.style.setProperty('--mx', `${px * 100}%`);
        el!.style.setProperty('--my', `${py * 100}%`);
      });
    }
    function reset() {
      apply(0.5, 0.5);
    }
    function onPointer(e: PointerEvent) {
      const r = el!.getBoundingClientRect();
      apply(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
    }
    function onOrientation(e: DeviceOrientationEvent) {
      if (e.beta == null || e.gamma == null) return;
      // Téléphone tenu à ~40° : c'est la position neutre.
      const px = Math.min(1, Math.max(0, 0.5 + e.gamma / 50));
      const py = Math.min(1, Math.max(0, 0.5 + (e.beta - 40) / 50));
      apply(px, py);
    }

    el.addEventListener('pointermove', onPointer);
    el.addEventListener('pointerleave', reset);
    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onPointer);
      el.removeEventListener('pointerleave', reset);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, []);

  // iOS n'envoie le gyroscope qu'après une permission demandée sur un geste de l'utilisateur.
  function askMotionPermission() {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    DOE?.requestPermission?.().catch(() => {});
  }

  return (
    <div ref={ref} className={`tilt ${className}`.trim()} onPointerDown={askMotionPermission}>
      {children}
    </div>
  );
}
