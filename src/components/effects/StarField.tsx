"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Star = {
  x: number;
  y: number;
  size: number;
  phase: number;
  speed: number;
};
const seed = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function StarField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = canvas.current;
    const context = el?.getContext("2d");
    if (!el || !context) return;
    const stars: Star[] = Array.from(
      { length: window.innerWidth < 768 ? 30 : 60 },
      (_, i) => ({
        x: seed(i + 1),
        y: seed(i + 104),
        size: 0.5 + seed(i + 205) * 1.2,
        phase: seed(i + 310) * Math.PI * 2,
        speed: 0.000004 + seed(i + 415) * 0.000007,
      }),
    );
    let width = 0,
      height = 0,
      frame = 0,
      visible = true,
      last = 0;
    const pointer = { x: -1000, y: -1000 };
    const draw = (time: number) => {
      const delta = last ? Math.min(time - last, 40) : 16;
      last = time;
      context.clearRect(0, 0, width, height);
      for (const star of stars) {
        if (!reduced) star.y = (star.y - star.speed * delta + 1) % 1;
        let x = star.x * width,
          y = star.y * height;
        const dx = x - pointer.x,
          dy = y - pointer.y,
          distance = Math.hypot(dx, dy);
        if (!reduced && distance < 150 && distance > 0) {
          const force = (1 - distance / 150) * 15;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }
        context.globalAlpha = reduced
          ? 0.5
          : 0.25 + (Math.sin(time * 0.0007 + star.phase) + 1) * 0.24;
        context.fillStyle = star.size > 1.2 ? "#f2b8ea" : "#c284d8";
        context.beginPath();
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fill();
      }
      if (visible && !document.hidden && !reduced)
        frame = requestAnimationFrame(draw);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden) draw(performance.now());
    };
    const resize = () => {
      const rect = el.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      start();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    intersection.observe(el);
    const move = (event: PointerEvent) => {
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const leave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };
    document.addEventListener("visibilitychange", start);
    if (!reduced) {
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
    }
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", start);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);
  return <canvas ref={canvas} className="star-field" aria-hidden="true" />;
}
