"use client";
import { useEffect, useState } from "react";
import { usePageScroll } from "@/components/motion/PageScrollProvider";
export function useScrollThreshold(threshold: number) {
  const { y } = usePageScroll();
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    let previous = y.get() > threshold;
    setPassed(previous);
    return y.on("change", (value) => {
      const next = value > threshold;
      if (next !== previous) {
        previous = next;
        setPassed(next);
      }
    });
  }, [y, threshold]);
  return passed;
}
