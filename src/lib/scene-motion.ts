import type { SceneLayout } from "./scene-layout";
import {
  SCENE_IDLE_MS,
  stepSceneMomentum,
  SCENE_FRICTION_PER_MS,
  SCENE_MAX_SCROLL_PX_PER_MS,
  SCENE_TRANSITION_MS,
  sceneGap,
  smoothSceneEase,
  capSceneScroll,
  sceneScrollTarget,
} from "./scene-transitions";

type Options = {
  port: HTMLElement;
  getLayout: () => SceneLayout | null;
  render: () => void;
};

/** Native scrolling owns input; crossing speed is bounded before scenes render. */
export function createSceneMotion({ port, getLayout, render }: Options) {
  let frame = 0;
  let destroyed = false,
    touching = false,
    lastActivity = 0;
  let direction = 1;
  let expectedPosition = port.scrollTop;
  let lastPosition = port.scrollTop;
  let lastScrollTime = performance.now();
  let momentumFrame = 0;
  let momentum: { from: number; to: number; position: number; velocity: number; time: number } | null = null;
  let animation: {
    origin: number;
    destination: () => number;
    started: number;
    duration: number;
  } | null = null;
  const enabled = () =>
    !destroyed && port.dataset.mode === "pinned" && Boolean(getLayout());
  const markState = () => {
    port.dataset.transition = animation || momentum
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
    lastScrollTime = performance.now();
    port.removeAttribute("aria-busy");
    markState();
  };
  const clearMomentum = () => {
    cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
    momentum = null;
  };
  const drainMomentum = (time: number) => {
    momentumFrame = 0;
    if (!enabled() || !momentum) {
      clearMomentum();
      markState();
      return;
    }
    const layout = getLayout()!;
    const start = layout.scenes[momentum.from].start + layout.scenes[momentum.from].hold;
    const end = layout.scenes[momentum.to].start;
    // A resize must not carry an old crossing into a chapter's reading area.
    if (lastPosition < start - 1 || lastPosition > end + 1) {
      clearMomentum();
      markState();
      return;
    }
    const destination = direction > 0 ? end : start;
    const remaining = destination - momentum.position;
    const completing = !touching && time - lastActivity >= SCENE_IDLE_MS;
    const next = stepSceneMomentum(momentum.velocity, time - momentum.time,
      completing ? remaining : undefined);
    momentum.velocity = next.velocity;
    momentum.time = time;
    momentum.position = Math.max(start, Math.min(end, momentum.position + next.distance));
    if (Math.abs(destination - momentum.position) <= 0.5) momentum.position = destination;
    port.scrollTop = momentum.position;
    expectedPosition = lastPosition = port.scrollTop;
    lastScrollTime = time;
    if (momentum.position === destination) clearMomentum();
    markState();
    render();
    if (!destroyed && momentum) momentumFrame = requestAnimationFrame(drainMomentum);
  };
  const tick = (time: number) => {
    if (!enabled() || !animation) {
      cancel();
      return;
    }
    const destination = animation.destination();
    const phase = Math.min(1, (time - animation.started) / animation.duration);
    port.scrollTop =
      animation.origin +
      (destination - animation.origin) *
        smoothSceneEase(phase);
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
  ) => {
    cancel();
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
    };
    markState();
    expectedPosition = port.scrollTop;
    markState();
    frame = requestAnimationFrame(tick);
  };
  const schedule = () => {
    if (!enabled() || animation) return;
    const gap = sceneGap(getLayout()!, port.scrollTop);
    if (!momentum && gap) {
      momentum = { ...gap, position: port.scrollTop, velocity: 0, time: performance.now() };
    }
    if (momentum && !momentumFrame) momentumFrame = requestAnimationFrame(drainMomentum);
    markState();
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
      if (momentum && Math.sign(event.deltaY) !== direction)
        clearMomentum();
      direction = Math.sign(event.deltaY);
      activity();
    }
  };
  const touchStart = () => {
    clearMomentum();
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
    ) {
      clearMomentum();
      activity();
    }
  };
  const pointerdown = () => {
    if (animation || momentum) {
      clearMomentum();
      activity();
    }
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
    clearMomentum();
    cancel();
    if (smooth) animateTo(destination, SCENE_TRANSITION_MS);
    else {
      port.scrollTop = destination();
      lastPosition = port.scrollTop;
      lastScrollTime = performance.now();
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
        const origin = lastPosition;
        const previousTime = lastScrollTime;
        cancel();
        lastPosition = origin;
        lastScrollTime = previousTime;
        lastActivity = now;
      }
      const now = performance.now(),
        delta = port.scrollTop - lastPosition;
      if (delta !== 0) {
        if (momentum && Math.sign(delta) !== direction)
          clearMomentum();
        direction = Math.sign(delta);
        const layout = getLayout()!;
        const requested = sceneScrollTarget(layout, lastPosition, Math.max(0, Math.min(
          layout.maxScroll, lastPosition + delta,
        )));
        port.scrollTop = capSceneScroll(
          layout, lastPosition, requested, now - lastScrollTime,
        );
        const gap = sceneGap(layout, port.scrollTop + direction * 0.01);
        if (gap && (direction > 0
          ? requested > layout.scenes[gap.from].start + layout.scenes[gap.from].hold
          : requested < layout.scenes[gap.to].start)) {
          const velocity = (momentum?.velocity ?? 0) + delta * SCENE_FRICTION_PER_MS;
          momentum = { ...gap, position: port.scrollTop, time: now,
            velocity: Math.max(-SCENE_MAX_SCROLL_PX_PER_MS, Math.min(SCENE_MAX_SCROLL_PX_PER_MS, velocity)) };
        } else clearMomentum();
        expectedPosition = port.scrollTop;
        lastPosition = port.scrollTop;
        lastScrollTime = now;
        lastActivity = now;
      }
      schedule();
      return false;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearMomentum();
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
