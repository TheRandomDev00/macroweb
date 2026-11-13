import { activeScene, type SceneLayout } from "./scene-layout";
import {
  SCENE_TRANSITION_MS,
  sceneGap,
  sceneLanding,
  smoothSceneEase,
  type SceneSwap,
} from "./scene-transitions";

type Options = {
  port: HTMLElement;
  getLayout: () => SceneLayout | null;
  render: () => void;
  onRunningChange: (running: boolean) => void;
};

/** Lock only scene changes, leaving native scrolling intact inside each scene's reading range. */
export function createSceneMotion({
  port,
  getLayout,
  render,
  onRunningChange,
}: Options) {
  let swap: SceneSwap | null = null;
  let frame = 0,
    started = 0,
    origin = 0,
    previousOverflow = "";
  let destroyed = false,
    lastPosition = port.scrollTop,
    lastInput = -Infinity;
  let inertiaLocked = false,
    touchY: number | null = null;
  let pending: number | null = null;
  let restoreFocus = false;
  const quietTime = 180;

  const enabled = () =>
    !destroyed && port.dataset.mode === "pinned" && Boolean(getLayout());
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (swap) port.style.overflowY = previousOverflow;
    swap = null;
    port.dataset.transition = "idle";
    port.removeAttribute("aria-busy");
    onRunningChange(false);
  };
  const tick = (time: number) => {
    const layout = getLayout();
    if (destroyed || !swap || !layout) {
      stop();
      return;
    }
    swap.progress = Math.min(1, (time - started) / SCENE_TRANSITION_MS);
    const destination = sceneLanding(layout, swap.to, swap.landing);
    port.scrollTop =
      origin + (destination - origin) * smoothSceneEase(swap.progress);
    lastPosition = port.scrollTop;
    render();
    if (destroyed || !swap) return;
    if (swap.progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    port.scrollTop = destination;
    lastPosition = port.scrollTop;
    stop();
    if (
      restoreFocus &&
      (document.activeElement === document.body ||
        document.activeElement === document.documentElement)
    ) {
      port.focus({ preventScroll: true });
    }
    render();
    if (pending !== null) {
      const next = pending;
      pending = null;
      navigate(next);
    }
  };
  const begin = (from: number, to: number, landing: "start" | "end") => {
    const layout = getLayout();
    if (!enabled() || !layout || !layout.scenes[from] || !layout.scenes[to])
      return;
    if (swap) {
      pending = to;
      return;
    }
    const destination = sceneLanding(layout, to, landing);
    if (from === to && Math.abs(port.scrollTop - destination) < 1) return;
    origin = port.scrollTop;
    restoreFocus = port.contains(document.activeElement);
    swap = {
      from,
      to,
      fromOffset: Math.max(0, origin - layout.scenes[from].start),
      landing,
      progress: 0,
    };
    previousOverflow = port.style.overflowY;
    // Cancel native touch/trackpad momentum. Programmatic animation remains available.
    port.style.overflowY = "hidden";
    port.dataset.transition = "running";
    port.setAttribute("aria-busy", "true");
    inertiaLocked = true;
    started = performance.now();
    onRunningChange(true);
    render();
    frame = requestAnimationFrame(tick);
  };
  function navigate(index: number, animate = true) {
    const layout = getLayout();
    if (!enabled() || !layout?.scenes[index]) return;
    if (swap && animate) {
      pending = index;
      return;
    }
    if (!animate) {
      pending = null;
      stop();
      inertiaLocked = false;
      port.scrollTop = sceneLanding(layout, index, "start");
      lastPosition = port.scrollTop;
      render();
      return;
    }
    begin(activeScene(layout, port.scrollTop), index, "start");
  }
  const settleGap = () => {
    if (!enabled() || swap) return Boolean(swap);
    const layout = getLayout()!;
    const position = port.scrollTop,
      direction = position >= lastPosition ? 1 : -1;
    lastPosition = position;
    const gap = sceneGap(layout, position);
    if (!gap) return false;
    if (direction > 0) begin(gap.from, gap.to, "start");
    else begin(gap.to, gap.from, "end");
    return Boolean(swap);
  };
  const boundary = (delta: number) => {
    const layout = getLayout();
    if (!layout || !delta) return false;
    if (settleGap()) return true;
    const index = activeScene(layout, port.scrollTop);
    const scene = layout.scenes[index];
    if (
      delta > 0 &&
      index < layout.scenes.length - 1 &&
      port.scrollTop + delta > scene.start + scene.hold
    ) {
      begin(index, index + 1, "start");
      return true;
    }
    if (delta < 0 && index > 0 && port.scrollTop + delta < scene.start) {
      begin(index, index - 1, "end");
      return true;
    }
    return false;
  };
  const lockedInput = () => {
    const now = performance.now();
    const locked =
      Boolean(swap) || (inertiaLocked && now - lastInput < quietTime);
    lastInput = now;
    if (!locked) inertiaLocked = false;
    return locked;
  };
  const wheel = (event: WheelEvent) => {
    if (
      !enabled() ||
      event.ctrlKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      !event.deltaY
    )
      return;
    const delta =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? port.clientHeight
          : 1);
    if (lockedInput() || boundary(delta)) event.preventDefault();
  };
  const touchStart = (event: TouchEvent) => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    if (!swap) inertiaLocked = false;
  };
  const touchMove = (event: TouchEvent) => {
    if (!enabled() || touchY === null || event.touches.length !== 1) return;
    const nextY = event.touches[0].clientY,
      delta = touchY - nextY;
    touchY = nextY;
    if (lockedInput() || boundary(delta)) {
      if (event.cancelable) event.preventDefault();
    }
  };
  const touchEnd = () => {
    touchY = null;
  };
  const keydown = (event: KeyboardEvent) => {
    if (
      !enabled() ||
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
    const down =
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      (event.key === " " && !event.shiftKey);
    const up =
      event.key === "ArrowUp" ||
      event.key === "PageUp" ||
      (event.key === " " && event.shiftKey);
    if (!down && !up && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    if (swap) return;
    if (event.repeat && lockedInput()) return;
    if (event.key === "Home" || event.key === "End") {
      navigate(event.key === "Home" ? 0 : getLayout()!.scenes.length - 1);
      return;
    }
    const distance = event.key.startsWith("Arrow")
      ? 40
      : port.clientHeight * 0.85;
    const delta = (down ? 1 : -1) * distance;
    if (!boundary(delta)) port.scrollBy({ top: delta, behavior: "instant" });
  };
  const scrollEnd = () => {
    settleGap();
  };

  port.dataset.transition = "idle";
  port.addEventListener("wheel", wheel, { passive: false });
  port.addEventListener("touchstart", touchStart, { passive: true });
  port.addEventListener("touchmove", touchMove, { passive: false });
  port.addEventListener("touchend", touchEnd, { passive: true });
  port.addEventListener("touchcancel", touchEnd, { passive: true });
  port.addEventListener("keydown", keydown);
  port.addEventListener("scrollend", scrollEnd);
  return {
    get swap() {
      return swap;
    },
    navigate,
    observeScroll: settleGap,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pending = null;
      stop();
      delete port.dataset.transition;
      port.removeEventListener("wheel", wheel);
      port.removeEventListener("touchstart", touchStart);
      port.removeEventListener("touchmove", touchMove);
      port.removeEventListener("touchend", touchEnd);
      port.removeEventListener("touchcancel", touchEnd);
      port.removeEventListener("keydown", keydown);
      port.removeEventListener("scrollend", scrollEnd);
    },
  };
}
