"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
export function Entrance({
  children,
  delay = 0,
  whenInView = false,
}: {
  children: ReactNode;
  delay?: number;
  whenInView?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!whenInView || !ref.current) return;
    const element = ref.current;
    const scene = element.closest<HTMLElement>(".scene-content");
    const panel = element.closest<HTMLElement>(".scene-panel");
    const port = element.closest<HTMLElement>(".scene-stack");
    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = port?.dataset.mode === "pinned" ? port.getBoundingClientRect() : null;
      const rect = element.getBoundingClientRect();
      const height = Math.max(0, Math.min(rect.bottom, viewport?.bottom ?? window.innerHeight) - Math.max(rect.top, viewport?.top ?? 0));
      const width = Math.max(0, Math.min(rect.right, viewport?.right ?? window.innerWidth) - Math.max(rect.left, viewport?.left ?? 0));
      const ratio = rect.width && rect.height ? width * height / (rect.width * rect.height) : 0;
      const sceneOpacity = scene ? Number(getComputedStyle(scene).opacity) : 1;
      const hidden = panel?.getAttribute("aria-hidden") === "true" || sceneOpacity <= 0.05;
      // Start the entrance halfway through the chapter's fade-in.
      if (ratio === 0 || hidden) setInView(false);
      else if (ratio >= 0.15 && sceneOpacity >= 0.5) setInView(true);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    if (scene) observer.observe(scene, { attributes: true, attributeFilter: ["style"] });
    if (panel) observer.observe(panel, { attributes: true, attributeFilter: ["aria-hidden", "style"] });
    if (port) observer.observe(port, { attributes: true, attributeFilter: ["data-mode"] });
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [whenInView]);
  return (
    <div
      ref={ref}
      className={`entrance${whenInView && !inView && !reduced ? " entrance--waiting" : ""}`}
      style={{ "--entrance-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
