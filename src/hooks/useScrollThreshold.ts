"use client";

import { useEffect, useState } from "react";

export function useScrollThreshold(threshold: number) {
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    let last = window.scrollY > threshold;
    setPassed(last);
    const update = () => {
      const next = window.scrollY > threshold;
      if (next !== last) {
        last = next;
        setPassed(next);
      }
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pageshow", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("pageshow", update);
    };
  }, [threshold]);
  return passed;
}
