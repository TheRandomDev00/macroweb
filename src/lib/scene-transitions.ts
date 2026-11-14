import type { SceneLayout } from "./scene-layout";
export const SCENE_TRANSITION_MS = 700;
export const SCENE_IDLE_MS = 20;
// Maximum user-driven speed across the animated gaps, in px/ms.
export const SCENE_MAX_SCROLL_PX_PER_MS = 0.8;

/** Deferred input belongs to the first crossing, never the reading area beyond it. */
export function sceneScrollTarget(layout: SceneLayout, origin: number, requested: number) {
  const forward = requested > origin;
  const scenes = forward ? layout.scenes.slice(0, -1) : layout.scenes.slice(0, -1).reverse();
  for (const scene of scenes) {
    const start = scene.start + scene.hold;
    const end = start + layout.transition;
    if (forward && origin < end && requested > start) return Math.min(requested, end);
    if (!forward && origin > start && requested < end) return Math.max(requested, start);
  }
  return requested;
}

export function capSceneScroll(
  layout: SceneLayout,
  origin: number,
  requested: number,
  elapsed: number,
) {
  const forward = requested > origin;
  const scenes = forward ? layout.scenes.slice(0, -1) : layout.scenes.slice(0, -1).reverse();
  // A long pause must not give the next gesture enough budget to skip a gap.
  const budget = SCENE_MAX_SCROLL_PX_PER_MS * Math.max(0, Math.min(32, elapsed));
  for (const scene of scenes) {
    const start = scene.start + scene.hold;
    const end = start + layout.transition;
    if (forward && origin < end && requested > start) {
      return Math.min(requested, end, Math.max(origin, start) + budget);
    }
    if (!forward && origin > start && requested < end) {
      return Math.max(requested, start, Math.min(origin, end) - budget);
    }
  }
  return requested;
}
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

export const SCENE_FRICTION_PER_MS = 0.008;
export const SCENE_COMPLETION_PX_PER_MS = 0.44;

/** Exponential drag integrated in milliseconds, independent of display refresh rate. */
export function stepSceneMomentum(velocity: number, elapsed: number, remaining?: number) {
  const time = Math.max(0, Math.min(32, elapsed));
  const desired = remaining === undefined ? 0 :
    Math.sign(remaining) * Math.min(SCENE_COMPLETION_PX_PER_MS, Math.abs(remaining) * 0.008);
  const decay = Math.exp(-SCENE_FRICTION_PER_MS * time);
  const speed = Math.max(-SCENE_MAX_SCROLL_PX_PER_MS,
    Math.min(SCENE_MAX_SCROLL_PX_PER_MS, velocity));
  return {
    velocity: desired + (speed - desired) * decay,
    distance: desired * time + (speed - desired) * (1 - decay) / SCENE_FRICTION_PER_MS,
  };
}
