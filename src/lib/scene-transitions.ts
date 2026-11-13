import type { SceneLayout } from "./scene-layout";
export const SCENE_TRANSITION_MS = 700;
export const SCENE_IDLE_MS = 150;
export function smoothSceneEase(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  // Cubic ease-out: immediate movement with a long, gentle deceleration.
  return 1 - Math.pow(1 - t, 3);
}
export function sceneLanding(
  layout: SceneLayout,
  index: number,
  landing: "start" | "end",
) {
  const scene = layout.scenes[index];
  return scene.start + (landing === "end" ? scene.hold : 0);
}
export function sceneGap(layout: SceneLayout, position: number) {
  for (let index = 0; index < layout.scenes.length - 1; index++) {
    const start = sceneLanding(layout, index, "end"),
      end = layout.scenes[index + 1].start;
    if (position > start && position < end)
      return { from: index, to: index + 1 };
  }
  return null;
}
export function sceneSettleTarget(layout: SceneLayout, position: number) {
  const gap = sceneGap(layout, position);
  if (!gap) return null;
  const start = sceneLanding(layout, gap.from, "end"),
    end = layout.scenes[gap.to].start;
  return position - start < end - position ? start : end;
}

export const SCENE_COAST_PX_PER_MS = 0.24;
