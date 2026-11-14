"use client";

import { ArrowUpRight, GitBranch, Plus, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Entrance } from "@/components/motion/Entrance";
import { releaseAge } from "@/lib/release-date";
import { easeOut } from "@/lib/motion-presets";

const releasesUrl = "https://github.com/TheRandomDev00/NITMASAAMacroFree/releases";
const endpoint = "https://api.github.com/repos/TheRandomDev00/NITMASAAMacroFree/releases?per_page=5";

type Release = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string;
  body: string | null;
  prerelease: boolean;
  draft: boolean;
};

export function Changelog() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setStatus("loading");
    async function load() {
      try {
        const response = await fetch(endpoint, {
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Releases unavailable");
        const data: Release[] = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid releases");
        if (!active) return;
        const recent = data
          .filter((release) => !release.draft && Number.isFinite(Date.parse(release.published_at)) && release.html_url?.startsWith(`${releasesUrl}/tag/`))
          .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
          .slice(0, 3);
        setReleases(recent);
        setOpen(recent[0]?.id ?? null);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  return (
    <section id="changelog" className="changelog" aria-labelledby="changelog-title">
      <Entrance whenInView delay={0.2}>
      <div className="section-heading">
        <span className="eyebrow"><GitBranch size={13} /> WHAT’S NEW</span>
        <h2 id="changelog-title">Change<span className="gradient-text">log</span></h2>
        <p>The latest releases of Anime Adventures Free.</p>
      </div>
      <div className="release-list" aria-busy={status === "loading"}>
        {status === "loading" && <p className="release-message" role="status">Loading releases…</p>}
        {status === "error" && (
          <div className="release-message" role="status">
            <p>Releases couldn’t be loaded. You can still view them on GitHub.</p>
            <button type="button" className="text-link" onClick={() => setAttempt((value) => value + 1)}>
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        )}
        {status === "ready" && releases.length === 0 && <p className="release-message" role="status">No published releases yet.</p>}
        {status === "ready" && releases.map((release, index) => (
          <article className="release-card" key={release.id}>
            <h3>
            <button type="button" className="release-toggle"
              id={`release-toggle-${release.id}`}
              aria-expanded={open === release.id}
              aria-controls={`release-content-${release.id}`}
              onClick={() => setOpen(open === release.id ? null : release.id)}>
              <span className="release-version">{release.tag_name}</span>
              <span className="release-name">{release.name || release.tag_name}</span>
              {release.prerelease ? <span className="release-badge">Pre-release</span> : index === 0 && <span className="release-badge">Newest</span>}
              <time dateTime={release.published_at} title={new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(release.published_at))}>
                {releaseAge(release.published_at)}
              </time>
              <Plus size={18} className="release-plus" aria-hidden="true" />
            </button>
            </h3>
            <motion.div
              id={`release-content-${release.id}`}
              role="region"
              aria-labelledby={`release-toggle-${release.id}`}
              aria-hidden={open !== release.id}
              inert={open !== release.id}
              className="release-dropdown"
              initial={false}
              animate={{ height: open === release.id ? "auto" : 0, opacity: open === release.id ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: easeOut }}
            >
            <div className="release-content">
              <p className="release-notes">{release.body?.trim() || "No release notes provided."}</p>
              <a href={release.html_url} target="_blank" rel="noopener noreferrer" className="text-link">
                View release on GitHub <ArrowUpRight size={14} />
              </a>
            </div>
            </motion.div>
          </article>
        ))}
      </div>
      <a className="text-link changelog-all" href={releasesUrl} target="_blank" rel="noopener noreferrer">
        All releases on GitHub <ArrowUpRight size={15} />
      </a>
      </Entrance>
    </section>
  );
}
