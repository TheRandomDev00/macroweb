"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useMotionValue, type MotionValue } from "motion/react";

type PageScroll = {
  y: MotionValue<number>;
  progress: MotionValue<number>;
  setElement: (element: HTMLElement | null) => void;
  update: () => void;
};
const Context = createContext<PageScroll | null>(null);

/** Header and progress use the same native scroll root as the scenes. */
export function PageScrollProvider({ children }: { children: ReactNode }) {
  const element = useRef<HTMLElement | null>(null);
  const y = useMotionValue(0),
    progress = useMotionValue(0);
  const update = useCallback(() => {
    const root = element.current;
    const position = root ? root.scrollTop : window.scrollY;
    const length = root
      ? root.scrollHeight - root.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    y.set(Math.max(0, position));
    progress.set(length > 0 ? Math.max(0, Math.min(1, position / length)) : 0);
  }, [y, progress]);
  const setElement = useCallback(
    (next: HTMLElement | null) => {
      element.current?.removeEventListener("scroll", update);
      element.current = next;
      next?.addEventListener("scroll", update, { passive: true });
      update();
    },
    [update],
  );
  useEffect(() => {
    const fallback = () => {
      if (!element.current) update();
    };
    window.addEventListener("scroll", fallback, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("pageshow", update);
    update();
    return () => {
      element.current?.removeEventListener("scroll", update);
      window.removeEventListener("scroll", fallback);
      window.removeEventListener("resize", update);
      window.removeEventListener("pageshow", update);
    };
  }, [update]);
  const value = useMemo(
    () => ({ y, progress, setElement, update }),
    [y, progress, setElement, update],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePageScroll() {
  const context = useContext(Context);
  if (!context) throw new Error("PageScrollProvider is required");
  return context;
}
