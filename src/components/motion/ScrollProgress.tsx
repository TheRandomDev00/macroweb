"use client";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";
import { progressSpring } from "@/lib/motion-presets";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll({ trackContentSize: true });
  const smoothed = useSpring(scrollYProgress, progressSpring);
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="scroll-progress"
      style={{ scaleX: reduced ? scrollYProgress : smoothed }}
    />
  );
}
