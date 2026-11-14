"use client";

import { useSyncExternalStore } from "react";

const query = "(max-width: 767px), (pointer: coarse), (prefers-reduced-motion: reduce)";
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

/** Mobile uses static content; desktop also respects the user's motion preference. */
export function useReducedEffects() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
