"use client";
import { createContext } from "react";
import type { MotionValue } from "motion/react";
export const SectionMotionContext = createContext(false);
export const SceneProgressContext = createContext<MotionValue<number> | null>(
  null,
);
