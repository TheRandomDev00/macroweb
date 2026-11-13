import type { SceneLayout } from "./scene-layout";
import {
  SCENE_IDLE_MS,
  sceneCoastDistance,
  SCENE_COAST_PX_PER_MS,
  SCENE_TRANSITION_MS,
  sceneGap,
  smoothSceneEase,
} from "./scene-transitions";

type Options = {
  port: HTMLElement;
  getLayout: () => SceneLayout | null;
  render: () => void;
};

/** Native scrolling owns input; unfinished crossings finish at a fixed gentle speed. */
export function createSceneMotion({ port, getLayout, render }: Options) {
  let frame = 0,
    idleTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false,
    touching = false,
    lastActivity = 0;
  let direction = 1;
  let expectedPosition = port.scrollTop;
  let lastPosition = port.scrollTop;
  let animation: {
    origin: number;
    destination: () => number;
    started: number;
    duration: number;
    linear: boolean;
  } | null = null;
  const enabled = () =>
    !destroyed && port.dataset.mode === "pinned" && Boolean(getLayout());
  const clearIdle = () => {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  };
  const markState = () => {
    port.dataset.transition = animation
      ? "running"
      : getLayout() && sceneGap(getLayout()!, port.scrollTop)
        ? "scrolling"
        : "idle";
  };
  const cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    animation = null;
    lastPosition = port.scrollTop;
    port.removeAttribute("aria-busy");
    markState();
  };
  const tick = (time: number) => {
    if (!enabled() || !animation) {
      cancel();
      return;
    }
    const destination = animation.destination();
    const distance = Math.abs(destination - animation.origin);
    const phase = animation.linear
      ? Math.min(
          1,
          sceneCoastDistance(time - animation.started) / Math.max(1, distance),
        )
      : Math.min(1, (time - animation.started) / animation.duration);
    port.scrollTop =
      animation.origin +
      (destination - animation.origin) *
        (animation.linear ? phase : smoothSceneEase(phase));
    expectedPosition = port.scrollTop;
    lastPosition = port.scrollTop;
    render();
    if (destroyed || !animation) return;
    if (phase < 1) frame = requestAnimationFrame(tick);
    else {
      port.scrollTop = destination;
      cancel();
      render();
    }
  };
  const animateTo = (
    destination: () => number,
    duration: number,
    linear = false,
  ) => {
    cancel();
    clearIdle();
    if (Math.abs(port.scrollTop - destination()) < 1) {
      markState();
      render();
      return;
    }
    animation = {
      origin: port.scrollTop,
      destination,
      started: performance.now(),
      duration,
      linear,
    };
    markState();
    frame = requestAnimationFrame(tick);
  };
  const settle = () => {
    idleTimer = null;
    if (!enabled() || animation || touching) return;
    const quiet = performance.now() - lastActivity;
    if (quiet < SCENE_IDLE_MS) {
      idleTimer = setTimeout(settle, SCENE_IDLE_MS - quiet);
      return;
    }
    const layout = getLayout()!;
    const gap = sceneGap(layout, port.scrollTop);
    if (!gap) {
      markState();
      return;
    }
    const forward = direction > 0;
    const destination = () => {
      const latest = getLayout()!;
      return forward
        ? latest.scenes[gap.to].start
        : latest.scenes[gap.from].start + latest.scenes[gap.from].hold;
    };
    // Preserve direction even before the midpoint; do not snap to the nearer chapter.
    const duration =
      Math.abs(destination() - port.scrollTop) / SCENE_COAST_PX_PER_MS;
    animateTo(destination, duration, true);
  };
  const schedule = () => {
    clearIdle();
    markState();
    if (
      enabled() &&
      !animation &&
      !touching &&
      sceneGap(getLayout()!, port.scrollTop)
    )
      idleTimer = setTimeout(settle, SCENE_IDLE_MS);
  };
  const activity = () => {
    if (!enabled()) return;
    if (animation) {
      cancel();
      render();
    }
    lastActivity = performance.now();
    schedule();
  };
  const wheel = (event: WheelEvent) => {
    if (
      !event.ctrlKey &&
      Math.abs(event.deltaY) >= Math.abs(event.deltaX) &&
      event.deltaY
    ) {
      direction = Math.sign(event.deltaY);
      activity();
    }
  };
  const touchStart = () => {
    touching = true;
    activity();
  };
  const touchMove = () => activity();
  const touchEnd = () => {
    touching = false;
    activity();
  };
  const keydown = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const target = event.target instanceof Element ? event.target : null;
    if (
      target?.closest(
        'input,textarea,select,[contenteditable="true"],[role="slider"]',
      )
    )
      return;
    if (event.key === " " && target?.closest('button,a,[role="button"]'))
      return;
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    )
      activity();
  };
  const pointerdown = () => {
    if (animation) activity();
  };
  const scrollEnd = () => {
    if (!animation) schedule();
  };
  const navigate = (index: number, smooth = true, offset = 0) => {
    if (!enabled() || !getLayout()?.scenes[index]) return;
    const destination = () => {
      const scene = getLayout()!.scenes[index];
      return scene.start + Math.max(0, Math.min(scene.travel, offset));
    };
    clearIdle();
    cancel();
    if (smooth) animateTo(destination, SCENE_TRANSITION_MS);
    else {
      port.scrollTop = destination();
      markState();
      render();
    }
  };
  port.dataset.transition = "idle";
  port.addEventListener("wheel", wheel, { passive: true });
  port.addEventListener("touchstart", touchStart, { passive: true });
  port.addEventListener("touchmove", touchMove, { passive: true });
  port.addEventListener("touchend", touchEnd, { passive: true });
  port.addEventListener("touchcancel", touchEnd, { passive: true });
  port.addEventListener("pointerdown", pointerdown, { passive: true });
  port.addEventListener("keydown", keydown);
  port.addEventListener("scrollend", scrollEnd);
  return {
    navigate,
    observeScroll() {
      if (!enabled()) return false;
      if (animation) {
        // Scroll events from our own RAF writes are ignored; late native movement takes over.
        if (Math.abs(port.scrollTop - expectedPosition) <= 1) return true;
        const delta = port.scrollTop - lastPosition;
        if (delta) direction = Math.sign(delta);
        const now = performance.now();
        cancel();
        lastActivity = now;
      }
      const now = performance.now(),
        delta = port.scrollTop - lastPosition;
      if (delta !== 0) {
        direction = Math.sign(delta);
        lastPosition = port.scrollTop;
        lastActivity = now;
      }
      schedule();
      return false;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearIdle();
      cancel();
      delete port.dataset.transition;
      port.removeEventListener("wheel", wheel);
      port.removeEventListener("touchstart", touchStart);
      port.removeEventListener("touchmove", touchMove);
      port.removeEventListener("touchend", touchEnd);
      port.removeEventListener("touchcancel", touchEnd);
      port.removeEventListener("pointerdown", pointerdown);
      port.removeEventListener("keydown", keydown);
      port.removeEventListener("scrollend", scrollEnd);
    },
  };
}
