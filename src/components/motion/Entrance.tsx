import type { CSSProperties, ReactNode } from "react";
export function Entrance({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="entrance"
      style={{ "--entrance-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
