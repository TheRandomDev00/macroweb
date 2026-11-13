"use client";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { Brand } from "@/components/ui/Brand";

const links = [
  { label: "About", href: "#about" },
  { label: "Store", href: "#store" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const compact = useScrollThreshold(20);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth >= 1100) setOpen(false);
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  return (
    <header className={`site-header ${compact || open ? "is-compact" : ""}`}>
      <div className="header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a
          className="header-community"
          href="#community"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Discord <ArrowUpRight size={15} />
        </a>
        <button
          ref={toggle}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
            <ArrowUpRight size={17} />
          </a>
        ))}
        <a
          href="#community"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          Join Discord
          <ArrowUpRight size={17} />
        </a>
      </nav>
    </header>
  );
}
