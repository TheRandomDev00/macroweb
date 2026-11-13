/** Use the visible window; only embedded documents need inflated-viewport protection. */
export function resolveSceneViewport(
  candidates: number[],
  embedded = false,
): number | null {
  const valid = candidates.filter(
    (value) => Number.isFinite(value) && value >= 240,
  );
  if (!valid.length) return null;
  if (!embedded) return Math.round(valid[0]);
  const smallest = Math.min(...valid);
  // Auto-expanding hosts can report several thousand pixels for every metric.
  return Math.round(smallest > 2400 ? 1100 : smallest);
}
