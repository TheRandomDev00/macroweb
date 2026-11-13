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
      {children}
    </section>
  );
}
