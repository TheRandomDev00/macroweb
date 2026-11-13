import { ScrollSection } from "@/components/motion/ScrollSection";
import type { ReactNode } from "react";
export function SectionLayer({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`section-layer ${className}`}>
      <ScrollSection
        direction={
          id === "store" || id === "how-it-works" || id === "faq"
            ? "right"
            : "left"
        }
      >
        {children}
      </ScrollSection>
    </section>
  );
}
