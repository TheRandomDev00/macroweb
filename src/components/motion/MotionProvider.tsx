"use client";
import { MotionConfig } from "motion/react";
import { PageScrollProvider } from "./PageScrollProvider";
import type { ReactNode } from "react";
import { useReducedEffects } from "@/hooks/useReducedEffects";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedEffects();
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <PageScrollProvider>{children}</PageScrollProvider>
    </MotionConfig>
  );
}
