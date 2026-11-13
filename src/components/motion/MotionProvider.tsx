"use client";
import { MotionConfig } from "motion/react";
import { PageScrollProvider } from "./PageScrollProvider";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PageScrollProvider>{children}</PageScrollProvider>
    </MotionConfig>
  );
}
