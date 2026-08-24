const KNOWN_LANES = new Set(['top', 'jungle', 'mid', 'adc', 'support']);

export function LaneIcon({ lane }: { lane: string }) {
  const id = lane.toLowerCase();
  if (!KNOWN_LANES.has(id)) return null;
  return (
    <svg className="icon" aria-hidden="true">
      <use href={`#lane-${id}`} />
    </svg>
  );
}
