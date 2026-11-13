export type SceneLayout = {
  viewport: number;
  transition: number;
  maxScroll: number;
  scenes: { start: number; hold: number; travel: number; center: number }[];
};
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

export function buildSceneLayout(
  heights: number[],
  viewport: number,
): SceneLayout {
  if (
    !Number.isFinite(viewport) ||
    viewport < 240 ||
    !heights.length ||
    heights.some((height) => !Number.isFinite(height) || height <= 0)
  )
    throw new RangeError("Invalid scene dimensions");
  const available = Math.max(1, viewport - 160);
  const transition = Math.round(Math.min(360, Math.max(160, viewport * 0.35)));
  let start = 0;
  const scenes = heights.map((height) => {
    const travel = Math.max(0, height - available);
    const hold = travel + Math.round(Math.min(160, viewport * 0.16));
    const scene = {
      start,
      hold,
      travel,
      center: Math.min(64, Math.max(0, (available - height) / 2)),
    };
    start += hold + transition;
    return scene;
  });
  const last = scenes.at(-1);
  return {
    viewport,
    transition,
    scenes,
    maxScroll: last ? last.start + last.hold : 0,
  };
}

export function sampleScene(
  layout: SceneLayout,
  index: number,
  scroll: number,
) {
  const scene = layout.scenes[index];
  const enter =
    index === 0
      ? 1
      : clamp((scroll - scene.start + layout.transition) / layout.transition);
  const exit =
    index === layout.scenes.length - 1
      ? 0
      : clamp((scroll - scene.start - scene.hold) / layout.transition);
  // Smootherstep keeps the depth effect still at both ends of the crossing.
  const sink = exit * exit * exit * (exit * (exit * 6 - 15) + 10);
  return {
    opacity: enter * (1 - exit),
    x: (index % 2 === 0 ? -18 : 18) * (1 - enter),
    y: scene.center - clamp(scroll - scene.start, 0, scene.travel) + 80 * sink,
    z: -340 * sink,
    scale: 1 - 0.1 * sink,
    rotateX: 8 * sink,
    blur: 2 * sink,
    sink,
    progress: clamp((scroll - scene.start) / Math.max(1, scene.hold)),
  };
}

export function activeScene(layout: SceneLayout, scroll: number) {
  let active = 0;
  layout.scenes.forEach((scene, index) => {
    if (scroll >= scene.start - layout.transition / 2) active = index;
  });
  return active;
}
