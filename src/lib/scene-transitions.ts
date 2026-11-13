import type { SceneLayout } from "./scene-layout";

export const SCENE_TRANSITION_MS = 700;
export type SceneSwap = {
  from: number;
  to: number;
  fromOffset: number;
  landing: "start" | "end";
  progress: number;
};
const clamp = (value: number, max = 1) => Math.max(0, Math.min(max, value));
export function smoothSceneEase(progress: number) {
  const t = clamp(progress);
  return t * t * t * (t * (t * 6 - 15) + 10);
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
    const start = sceneLanding(layout, index, "end");
    const end = layout.scenes[index + 1].start;
    if (position > start && position < end)
      return { from: index, to: index + 1 };
  }
  return null;
}

/** The two selected scenes share the stage; intervening navigation destinations never flash. */
export function sampleSceneSwap(
  layout: SceneLayout,
  index: number,
  swap: SceneSwap,
) {
  const eased = smoothSceneEase(swap.progress);
  const from = layout.scenes[swap.from],
    to = layout.scenes[swap.to];
  const destinationOffset = swap.landing === "end" ? to.hold : 0;
  if (swap.from === swap.to && index === swap.from) {
    const offset =
      swap.fromOffset + (destinationOffset - swap.fromOffset) * eased;
    return {
      opacity: 1,
      x: 0,
      y: from.center - clamp(offset, from.travel),
      progress: clamp(offset / from.hold),
    };
  }
  if (index === swap.from)
    return {
      opacity: 1 - eased,
      x: 0,
      y: from.center - clamp(swap.fromOffset, from.travel),
      progress: clamp(swap.fromOffset / from.hold),
    };
  if (index === swap.to)
    return {
      opacity: eased,
      x: (swap.to % 2 === 0 ? -18 : 18) * (1 - eased),
      y: to.center - clamp(destinationOffset, to.travel),
      progress: swap.landing === "end" ? 1 : 0,
    };
  return { opacity: 0, x: 0, y: 0, progress: 0 };
}
