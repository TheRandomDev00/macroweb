"use client";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, type ReactNode } from "react";

export function Entrance({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const opacity = useMotionValue(1);
  const blur = useMotionValue(0);
  const filter = useMotionTemplate`blur(${blur}px)`;
  useEffect(() => {
    if (reduced) {
      opacity.set(1);
      blur.set(0);
      return;
    }
    opacity.set(0);
    blur.set(10);
    const fade = animate(opacity, 1, { duration: 0.8, delay, ease: "easeOut" });
    const focus = animate(blur, 0, { duration: 0.8, delay, ease: "easeOut" });
    return () => {
      fade.stop();
      focus.stop();
    };
  }, [reduced, delay, opacity, blur]);
  return <motion.div style={{ opacity, filter }}>{children}</motion.div>;
}
