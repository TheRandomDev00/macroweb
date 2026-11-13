import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ParticleNetwork } from "@/components/effects/ParticleNetwork";
import "./globals.css";

export const metadata: Metadata = {
  title: "Informaal Frog — Less grind. More game.",
  description:
    "An independent interface study inspired by Informaal Frog. Discover game automation tools through a responsive, scroll-driven experience.",
  icons: { icon: "/images/informaal.png" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>
          <ParticleNetwork />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
