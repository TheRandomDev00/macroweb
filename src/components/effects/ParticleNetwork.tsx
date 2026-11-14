"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

/** Viewport-sized, fixed network: one canvas and one animation loop for the page. */
export function ParticleNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scrollRoot = document.querySelector<HTMLElement>(".scene-stack");
    const lightEffects = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    let width = 0,
      height = 0,
      frame = 0,
      lastTime = 0;
    let particles: Particle[] = [];
    const pointer = { x: -1000, y: -1000 };
    const reach = 145;

    const draw = (time: number) => {
      // Leave the existing canvas frame in place while mobile transitions need the GPU.
      if (lightEffects.matches && scrollRoot && scrollRoot.dataset.transition !== "idle" && scrollRoot.dataset.transition) {
        lastTime = time;
        if (!reduced && !document.hidden) frame = requestAnimationFrame(draw);
        return;
      }
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.04) : 0;
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      // Spatial buckets avoid comparing every particle with every other particle.
      const grid = new Map<string, number[]>();
      particles.forEach((p, i) => {
        if (!reduced) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const dx = p.x - pointer.x,
            dy = p.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 100) {
            const force = (1 - distance / 100) * 26 * dt;
            p.x += (dx / distance) * force;
            p.y += (dy / distance) * force;
          }
          if (p.x < -4) p.x = width + 4;
          if (p.x > width + 4) p.x = -4;
          if (p.y < -4) p.y = height + 4;
          if (p.y > height + 4) p.y = -4;
        }
        const key = `${Math.floor(p.x / reach)},${Math.floor(p.y / reach)}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(i);
        else grid.set(key, [i]);
      });
      ctx.lineWidth = 0.65;
      particles.forEach((p, i) => {
        const gx = Math.floor(p.x / reach),
          gy = Math.floor(p.y / reach);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++) {
            for (const j of grid.get(`${gx + dx},${gy + dy}`) ?? []) {
              if (j <= i) continue;
              const other = particles[j];
              const distance = Math.hypot(p.x - other.x, p.y - other.y);
              if (distance >= reach) continue;
              ctx.strokeStyle = `rgba(76, 156, 255, ${(1 - distance / reach) * 0.34})`;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
      });
      for (const p of particles) {
        ctx.fillStyle = "rgba(129, 194, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (!document.hidden) draw(performance.now());
    };
    const resize = () => {
      const oldWidth = width,
        oldHeight = height;
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(
        width < 768 ? 85 : 210,
        Math.max(45, Math.round((width * height) / 6500)),
      );
      particles = Array.from({ length: count }, (_, i) => {
        const existing = particles[i];
        if (existing && oldWidth && oldHeight)
          return {
            ...existing,
            x: (existing.x / oldWidth) * width,
            y: (existing.y / oldHeight) * height,
          };
        const angle = Math.random() * Math.PI * 2,
          speed = 9 + Math.random() * 17;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 0.8 + Math.random() * 1.3,
        };
      });
      restart();
    };
    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const leave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", restart);
    if (!reduced) {
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
    }
    resize();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", restart);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);

  return <canvas ref={ref} className="particle-network" aria-hidden="true" />;
}
