import { Download, Gamepad2, Users, Zap } from "lucide-react";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
const stats = [
  { label: "Downloads", value: 23089, suffix: "", decimals: 1, icon: Download },
  { label: "Active players", value: 3, suffix: "K+", decimals: 0, icon: Users },
  { label: "Tool uses", value: 137, suffix: "K+", decimals: 1, icon: Zap },
];
export function Stats() {
  return (
    <section className="stats-section" aria-label="DevRealm at a glance">
      <div className="stats-inner page-width">
        {stats.map((stat, i) => (
          <Reveal className="stat" delay={i * 0.08} key={stat.label}>
            <stat.icon size={17} />
            <strong>
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
              />
            </strong>
            <span>{stat.label}</span>
          </Reveal>
        ))}
      </div>
      <p className="stats-source">
        Reference activity snapshot · November 2026
      </p>
    </section>
  );
}
