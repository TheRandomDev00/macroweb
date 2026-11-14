import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { terms } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service — DevRealm",
  description: "Terms of Service for the DevRealm website and digital products.",
};

export default function TermsPage() {
  return (
    <main id="top" className="terms-page">
      <div className="terms-shell">
        <nav className="terms-nav" aria-label="Terms navigation">
          <Link className="brand" href="/" aria-label="DevRealm home">
            <img src="/images/image.png" width={40} height={40} alt="" />
            <span>Dev<span className="gradient-text">Realm</span></span>
          </Link>
          <Link className="text-link" href="/"><ArrowLeft size={15} /> Back to home</Link>
        </nav>
        <header className="terms-header">
          <span className="eyebrow">DEVREALM</span>
          <h1>Terms of <span className="gradient-text">Service</span></h1>
        </header>
        <article className="terms-document" aria-labelledby="acceptance-title">
          <h2 id="acceptance-title">1. Acceptance of Terms</h2>
          {terms.map((clause) => (
            <p key={clause.number} id={`clause-${clause.number.replace(".", "-")}`}>
              <span className="terms-clause-number">{clause.number}.</span>{" "}{clause.text}
            </p>
          ))}
        </article>
        <footer className="terms-footer">
          <p>© 2026 DevRealm.</p>
          <a className="text-link" href="#top">Back to top <ArrowUp size={15} /></a>
        </footer>
      </div>
    </main>
  );
}
