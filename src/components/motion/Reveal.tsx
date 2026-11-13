"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { easeOut } from "@/lib/motion-presets";

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -36px 0px" });
  const reduced = useReducedMotion();
  // Visible server output keeps the document readable without JavaScript.
  const opacity = useMotionValue(1);
  const y = useMotionValue(0);
  useEffect(() => {
    if (reduced) {
      opacity.set(1);
      y.set(0);
      return;
    }
    if (!inView) {
      opacity.set(0);
      y.set(distance);
      return;
    }
    const fade = animate(opacity, 1, { duration: 0.6, delay, ease: easeOut });
    const slide = animate(y, 0, { duration: 0.7, delay, ease: easeOut });
    return () => {
      fade.stop();
      slide.stop();
    };
  }, [inView, reduced, delay, distance, opacity, y]);
  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}
