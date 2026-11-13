"use client";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
export function PromoBanner() {
  const visible = useScrollThreshold(240);
  return (
    <div className={`promo-wrapper ${visible ? "is-visible" : ""}`}>
      <div>
        <a className="promo-banner" href="#free-tools">
          <Sparkles size={15} />
          <span>
            A little less busywork. A lot more possibility.{" "}
            <strong>Meet Informaal Task — it’s free.</strong>
          </span>
          <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  );
}
