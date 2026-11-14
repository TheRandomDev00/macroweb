"use client";
import { useReducedEffects } from "@/hooks/useReducedEffects";
import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

export function CountUp({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedEffects();
  const formatted = value.toFixed(decimals) + suffix;
  useEffect(() => {
    if (!ref.current) return;
    if (reduced) {
      ref.current.textContent = formatted;
      return;
    }
    if (!inView) return;
    const animation = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (current) => {
        if (ref.current)
          ref.current.textContent = current.toFixed(decimals) + suffix;
      },
    });
    return () => animation.stop();
  }, [inView, reduced, value, decimals, suffix, formatted]);
  return (
    <span aria-label={formatted}>
      <span ref={ref} aria-hidden="true">
        {formatted}
      </span>
    </span>
  );
}
