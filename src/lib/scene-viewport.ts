/** Reject unusable metrics, and bound auto-expanding iframe viewport reports. */
export function resolveSceneViewport(candidates: number[]): number | null {
  const valid = candidates.filter(
    (value) => Number.isFinite(value) && value >= 240,
  );
  if (!valid.length) return null;
  return Math.round(Math.min(...valid, 1100));
}
