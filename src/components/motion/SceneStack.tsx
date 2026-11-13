"use client";

import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motionValue, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  activeScene,
  buildSceneLayout,
  sampleScene,
  type SceneLayout,
} from "@/lib/scene-layout";
import { createSceneMotion } from "@/lib/scene-motion";
import { sampleSceneSwap } from "@/lib/scene-transitions";
import { resolveSceneViewport } from "@/lib/scene-viewport";
import { SceneProgressContext, SectionMotionContext } from "./SceneContext";
import { usePageScroll } from "./PageScrollProvider";

/** A bounded native scrollport makes viewport, scroll position, and sticky root identical. */
export function SceneStack({
  children,
  labels,
}: {
  children: ReactNode;
  labels: string[];
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const progress = useMemo(() => items.map(() => motionValue(0)), [items]);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const runway = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const contents = useRef<(HTMLDivElement | null)[]>([]);
  const layout = useRef<SceneLayout | null>(null);
  const navigate = useRef<(index: number, smooth?: boolean) => void>(() => {});
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const scroll = usePageScroll();

  useEffect(() => {
    const port = root.current,
      track = runway.current,
      view = stage.current;
    if (!port || !track || !view) return;
    let disposed = false,
      failed = false,
      measuring = false;
    let paintFrame = 0,
      measureFrame = 0,
      initialized = false,
      signature = "";
    let lastActive = -1;
    let motion: ReturnType<typeof createSceneMotion> | null = null;
    const reset = (reason: string) => {
      failed = true;
      motion?.destroy();
      port.dataset.mode = "flow";
      port.dataset.sceneFallback = reason;
      port.style.removeProperty("--scene-viewport");
      track.style.height = "";
      panels.current.forEach((panel) => {
        panel?.removeAttribute("inert");
        panel?.removeAttribute("aria-hidden");
        if (panel) {
          panel.style.visibility = "";
          panel.style.pointerEvents = "";
          panel.style.zIndex = "";
          delete panel.dataset.visible;
        }
      });
      contents.current.forEach((content) => {
        if (content) {
          content.style.opacity = "";
          content.style.transform = "";
        }
      });
      layout.current = null;
      scroll.setElement(null);
      setPinned(false);
    };
    const paint = () => {
      paintFrame = 0;
      if (disposed || failed || !layout.current) return;
      try {
        const current = layout.current;
        const position = Math.max(
          0,
          Math.min(port.scrollTop, current.maxScroll),
        );
        const swap = motion?.swap;
        const nextActive = swap ? swap.to : activeScene(current, position);
        current.scenes.forEach((_, index) => {
          const panel = panels.current[index],
            content = contents.current[index];
          if (!panel || !content) throw new Error("Missing scene nodes");
          const sample = swap
            ? sampleSceneSwap(current, index, swap)
            : sampleScene(current, index, position);
          if (![sample.opacity, sample.x, sample.y].every(Number.isFinite))
            throw new Error("Invalid scene sample");
          // Commit actual DOM visibility and interaction state together, before enabling pinning.
          content.style.opacity = String(sample.opacity);
          content.style.transform = `translate3d(${sample.x}%, ${sample.y}px, 0)`;
          panel.style.visibility = sample.opacity > 0 ? "visible" : "hidden";
          panel.dataset.visible = String(sample.opacity > 0);
          const interactive = !swap && index === nextActive;
          panel.toggleAttribute("inert", !interactive);
          panel.setAttribute("aria-hidden", String(!interactive));
          panel.style.pointerEvents = interactive ? "auto" : "none";
          panel.style.zIndex = String(index);
          progress[index].set(sample.progress);
        });
        if (lastActive !== nextActive) {
          lastActive = nextActive;
          setActive(nextActive);
        }
        // A failed sticky implementation must never leave an empty scroll runway.
        if (
          initialized &&
          position > 30 &&
          Math.abs(
            view.getBoundingClientRect().top - port.getBoundingClientRect().top,
          ) > 4
        ) {
          reset("stage-not-pinned");
          return;
        }
        scroll.update();
      } catch {
        reset("render-failed");
      }
    };
    const queuePaint = () => {
      if (motion?.observeScroll()) return;
      if (!paintFrame && !failed) paintFrame = requestAnimationFrame(paint);
    };
    const goTo = (index: number, smooth = true) => {
      motion?.navigate(index, smooth);
    };
    navigate.current = goTo;
    const hashIndex = (hash: string) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return -1;
      }
      if (id === "top") return 0;
      const panel = document
        .getElementById(id)
        ?.closest<HTMLElement>("[data-scene-index]");
      return panel && port.contains(panel)
        ? Number(panel.dataset.sceneIndex)
        : -1;
    };
    const restoreHash = () => {
      const index = hashIndex(location.hash || "#top");
      if (index >= 0) goTo(index, false);
    };
    const measure = () => {
      measureFrame = 0;
      if (disposed || failed || measuring) return;
      measuring = true;
      try {
        const viewport = resolveSceneViewport([
          window.visualViewport?.height ?? 0,
          document.documentElement.clientHeight,
          window.innerHeight,
          window.screen.availHeight,
        ]);
        if (!viewport) {
          reset("invalid-viewport");
          return;
        }
        if (
          contents.current.length !== items.length ||
          !contents.current.every(Boolean)
        ) {
          reset("missing-content");
          return;
        }
        // Preparing and pinned have identical CSS. Measure the final geometry, not the fallback page.
        port.style.setProperty("--scene-viewport", `${viewport}px`);
        port.dataset.mode = initialized ? "pinned" : "preparing";
        const height = port.clientHeight;
        const heights = contents.current.map(
          (content) => content?.offsetHeight ?? 0,
        );
        if (
          height < 240 ||
          Math.abs(height - viewport) > 2 ||
          Math.abs(view.clientHeight - height) > 2 ||
          getComputedStyle(view).position !== "sticky" ||
          panels.current.some(
            (panel) =>
              !panel || getComputedStyle(panel).position !== "absolute",
          ) ||
          heights.some((value) => value <= 0 || !Number.isFinite(value))
        ) {
          reset("invalid-geometry");
          return;
        }
        const nextSignature = `${height}:${heights.join(",")}`;
        if (initialized && nextSignature === signature) {
          motion?.observeScroll();
          paint();
          return;
        }
        signature = nextSignature;
        layout.current = buildSceneLayout(heights, height);
        track.style.height = `${layout.current.maxScroll + height}px`;
        if (initialized) motion?.observeScroll();
        paint();
        if (failed) return;
        port.dataset.mode = "pinned";
        delete port.dataset.sceneFallback;
        scroll.setElement(port);
        if (!initialized) {
          initialized = true;
          setPinned(true);
          if (location.hash) restoreHash();
          paint();
        }
      } catch {
        reset("measurement-failed");
      } finally {
        measuring = false;
      }
    };
    const queueMeasure = () => {
      if (!measureFrame && !failed)
        measureFrame = requestAnimationFrame(measure);
    };
    if (
      reduced ||
      typeof ResizeObserver === "undefined" ||
      !CSS.supports("position", "sticky")
    ) {
      reset(reduced ? "reduced-motion" : "unsupported-layout");
      return;
    }
    const observer = new ResizeObserver(queueMeasure);
    contents.current.forEach((content) => {
      if (content) observer.observe(content);
    });
    const click = (event: MouseEvent) => {
      if (
        failed ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      )
        return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        !url.hash
      )
        return;
      const index = hashIndex(url.hash);
      if (index < 0) return;
      event.preventDefault();
      history.pushState(null, "", url.hash);
      goTo(index);
    };
    motion = createSceneMotion({
      port,
      getLayout: () => layout.current,
      render: paint,
      onRunningChange: setTransitioning,
    });
    port.addEventListener("scroll", queuePaint, { passive: true });
    port.addEventListener("load", queueMeasure, true);
    window.addEventListener("resize", queueMeasure);
    window.visualViewport?.addEventListener("resize", queueMeasure);
    window.addEventListener("pageshow", queueMeasure);
    window.addEventListener("hashchange", restoreHash);
    window.addEventListener("popstate", restoreHash);
    document.addEventListener("click", click);
    document.fonts?.ready.then(() => {
      if (!disposed) queueMeasure();
    });
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(paintFrame);
      cancelAnimationFrame(measureFrame);
      observer.disconnect();
      port.removeEventListener("scroll", queuePaint);
      port.removeEventListener("load", queueMeasure, true);
      window.removeEventListener("resize", queueMeasure);
      window.visualViewport?.removeEventListener("resize", queueMeasure);
      window.removeEventListener("pageshow", queueMeasure);
      window.removeEventListener("hashchange", restoreHash);
      window.removeEventListener("popstate", restoreHash);
      document.removeEventListener("click", click);
      reset("cleanup");
    };
  }, [items.length, progress, reduced, scroll]);

  const goTo = useCallback((index: number) => navigate.current(index), []);
  return (
    <div
      ref={root}
      className="scene-stack"
      tabIndex={0}
      role="region"
      aria-label="Website content"
    >
      <div ref={runway} className="scene-runway">
        <div ref={stage} className="scene-stage">
          {items.map((item, index) => (
            <div
              key={index}
              className="scene-panel"
              data-scene-index={index}
              ref={(node) => {
                panels.current[index] = node;
              }}
            >
              <div
                className="scene-content"
                ref={(node) => {
                  contents.current[index] = node;
                }}
              >
                <SectionMotionContext.Provider value={true}>
                  <SceneProgressContext.Provider value={progress[index]}>
                    {item}
                  </SceneProgressContext.Provider>
                </SectionMotionContext.Provider>
              </div>
            </div>
          ))}
        </div>
      </div>
      {pinned && (
        <nav className="scene-navigation" aria-label="Page sections">
          <button
            aria-label="Previous section"
            disabled={transitioning || active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ArrowUp size={14} />
          </button>
          <span aria-live="polite">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(items.length).padStart(2, "0")}
            <span className="scene-current-label">{labels[active]}</span>
          </span>
          <button
            aria-label="Next section"
            disabled={transitioning || active === items.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ArrowDown size={14} />
          </button>
        </nav>
      )}
    </div>
  );
}
