"use client";
import { motion, useSpring, useReducedMotion } from "motion/react";
import { usePageScroll } from "./PageScrollProvider";
import { progressSpring } from "@/lib/motion-presets";

export function ScrollProgress() {
  const { progress: scrollYProgress } = usePageScroll();
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
