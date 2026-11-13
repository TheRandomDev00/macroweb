"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

export const ScrollSectionContext = createContext(false);

/** Measure the stationary wrapper; translate only its contents. No timed playback. */
export function ScrollSection({
  children,
  direction = "left",
}: {
  children: ReactNode;
  direction?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [enhanced, setEnhanced] = useState(false);
  const [focused, setFocused] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 96%", "start 52%"],
    trackContentSize: true,
  });
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [direction === "left" ? "-9%" : "9%", "0%"],
  );
  const opacity = useTransform(scrollYProgress, [0, 0.85, 1], [0, 1, 1]);
  useEffect(() => setEnhanced(true), []);
  const animated = enhanced && !reduced && !focused;

  return (
    <div
      ref={ref}
      className="scroll-section"
      data-scroll-direction={direction}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <motion.div
        className="scroll-section-content"
        style={{ x: animated ? x : 0, opacity: animated ? opacity : 1 }}
      >
        <ScrollSectionContext.Provider value={true}>
          {children}
        </ScrollSectionContext.Provider>
      </motion.div>
    </div>
  );
}
