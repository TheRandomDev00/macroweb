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
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  activeScene,
  buildSceneLayout,
  remapSceneScroll,
  sampleScene,
  type SceneLayout,
} from "@/lib/scene-layout";
import { SceneProgressContext, SectionMotionContext } from "./SceneContext";

type Controls = {
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  progress: MotionValue<number>;
};

function ScenePanel({
  children,
  index,
  label,
  enhanced,
  active,
  register,
  contentRef,
}: {
  children: ReactNode;
  index: number;
  label: string;
  enhanced: boolean;
  active: boolean;
  register: (index: number, controls: Controls) => () => void;
  contentRef: (node: HTMLDivElement | null) => void;
}) {
  const opacity = useMotionValue(1),
    x = useMotionValue(0),
    y = useMotionValue(0),
    progress = useMotionValue(0);
  const translateX = useTransform(x, (value) => `${value}%`);
  useEffect(
    () => register(index, { opacity, x, y, progress }),
    [register, index, opacity, x, y, progress],
  );
  return (
    <div
      className="scene-panel"
      data-scene-index={index}
      aria-label={label}
      aria-hidden={enhanced && !active ? true : undefined}
      inert={enhanced && !active}
      style={
        enhanced
          ? { zIndex: index, pointerEvents: active ? "auto" : "none" }
          : undefined
      }
    >
      <motion.div
        className="scene-content"
        style={{
          opacity: enhanced ? opacity : 1,
          x: enhanced ? translateX : 0,
          y: enhanced ? y : 0,
        }}
      >
        <div ref={contentRef} className="scene-content-inner">
          <SectionMotionContext.Provider value={true}>
            <SceneProgressContext.Provider value={progress}>
              {children}
            </SceneProgressContext.Provider>
          </SectionMotionContext.Provider>
        </div>
      </motion.div>
    </div>
  );
}

/** One sticky viewport, with natural document scroll controlling content travel and scene crossfades. */
export function SceneStack({
  children,
  labels,
}: {
  children: ReactNode;
  labels: string[];
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const contents = useRef<(HTMLDivElement | null)[]>([]);
  const controls = useRef(new Map<number, Controls>());
  const layout = useRef<SceneLayout | null>(null);
  const rootTop = useRef(0);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [runway, setRunway] = useState(0);
  const register = useCallback((index: number, values: Controls) => {
    controls.current.set(index, values);
    return () => {
      controls.current.delete(index);
    };
  }, []);

  const paint = useCallback(() => {
    const current = layout.current;
    if (!current) return;
    const scroll = Math.max(0, window.scrollY - rootTop.current);
    current.scenes.forEach((_, index) => {
      const sample = sampleScene(current, index, scroll);
      const values = controls.current.get(index);
      if (values) {
        values.opacity.set(sample.opacity);
        values.x.set(sample.x);
        values.y.set(sample.y);
        values.progress.set(sample.progress);
      }
    });
    const next = activeScene(current, scroll);
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  }, []);

  useEffect(() => {
    if (reduced) {
      setEnhanced(false);
      return;
    }
    let frame = 0,
      measureFrame = 0,
      lastSignature = "";
    const measure = () => {
      const viewport = enhanced
        ? stage.current?.clientHeight || window.innerHeight
        : window.innerHeight;
      const heights = contents.current.map((node) => node?.offsetHeight || 1);
      const signature = `${viewport}:${heights.join(",")}`;
      if (signature === lastSignature) return;
      lastSignature = signature;
      rootTop.current =
        (root.current?.getBoundingClientRect().top || 0) + window.scrollY;
      const next = buildSceneLayout(heights, viewport);
      const previous = layout.current;
      const scroll = Math.max(0, window.scrollY - rootTop.current);
      layout.current = next;
      setRunway(next.maxScroll + viewport);
      if (previous && scroll > 0) {
        const mapped = remapSceneScroll(previous, next, scroll);
        // Wait for React to commit the resized runway before restoring reading position.
        cancelAnimationFrame(measureFrame);
        measureFrame = requestAnimationFrame(() => {
          window.scrollTo({
            top: rootTop.current + mapped,
            behavior: "instant",
          });
          paint();
        });
      }
      paint();
      setEnhanced(true);
    };
    const observer = new ResizeObserver(measure);
    contents.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    if (stage.current && enhanced) observer.observe(stage.current);
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
    };
  }, [enhanced, reduced, paint]);

  const goTo = useCallback((index: number, smooth = true) => {
    const current = layout.current;
    if (!current) return;
    const scene = current.scenes[index];
    if (!scene) return;
    window.scrollTo({
      top: rootTop.current + scene.start,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    if (!enhanced || reduced) return;
    const navigate = (hash: string, smooth: boolean) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return false;
      }
      const target = document.getElementById(id);
      const panel = target?.closest<HTMLElement>("[data-scene-index]");
      const index =
        id === "top" ? 0 : panel ? Number(panel.dataset.sceneIndex) : -1;
      if (index < 0) return false;
      goTo(index, smooth);
      return true;
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
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
      if (navigate(url.hash, true)) {
        event.preventDefault();
        history.pushState(null, "", url.hash);
      }
    };
    const restore = () => navigate(location.hash || "#top", false);
    document.addEventListener("click", click);
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    const frame = location.hash ? requestAnimationFrame(restore) : 0;
    return () => {
      document.removeEventListener("click", click);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
      cancelAnimationFrame(frame);
    };
  }, [enhanced, reduced, goTo]);

  return (
    <div
      ref={root}
      className={`scene-stack ${enhanced && !reduced ? "is-enhanced" : ""}`}
      style={enhanced && !reduced ? { height: runway } : undefined}
    >
      <div ref={stage} className="scene-stage">
        {items.map((item, index) => (
          <ScenePanel
            key={index}
            index={index}
            label={labels[index]}
            enhanced={enhanced && !reduced}
            active={active === index}
            register={register}
            contentRef={(node) => {
              contents.current[index] = node;
            }}
          >
            {item}
          </ScenePanel>
        ))}
      </div>
      {enhanced && !reduced && (
        <nav className="scene-navigation" aria-label="Page sections">
          <button
            aria-label="Previous section"
            disabled={active === 0}
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
            disabled={active === items.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ArrowDown size={14} />
          </button>
        </nav>
      )}
    </div>
  );
}
