"use client";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { motion, useSpring } from "motion/react";
import { usePageScroll } from "./PageScrollProvider";
import { progressSpring } from "@/lib/motion-presets";

export function ScrollProgress() {
  const reduced = useReducedEffects();
  return reduced ? null : <AnimatedScrollProgress />;
}

function AnimatedScrollProgress() {
  const { progress: scrollYProgress } = usePageScroll();
  const smoothed = useSpring(scrollYProgress, progressSpring);
  return (
    <motion.div
      aria-hidden="true"
      className="scroll-progress"
      style={{ scaleX: smoothed }}
    />
  );
}
