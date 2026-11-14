import { ArrowUp, ArrowUpRight, MessageCircle, Youtube } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand footer />
            <p>
              A little automation.
              <br />A lot more possibility.
            </p>
            <div className="footer-socials">
              <a
                href="#community"
                aria-label="DevRealm Discord"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="#community"
                aria-label="DevRealm YouTube"
              >
                <Youtube size={19} />
              </a>
            </div>
          </div>
          <div className="footer-link-group">
            <h2>EXPLORE</h2>
            <a href="#premium-tools">Premium version</a>
            <a href="#free-tools">Free version</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-link-group">
            <h2>DEVREALM</h2>
            <a
              href="#how-it-works"
            >
              Guides <ArrowUpRight size={12} />
            </a>
            <a
              href="#changelog"
            >
              Updates <ArrowUpRight size={12} />
            </a>
            <a
              href="https://github.com/TheRandomDev00/NITMASAAMacroFree/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              Downloads <ArrowUpRight size={12} />
            </a>
            <Link href="/terms/">
              Terms of service <ArrowUpRight size={12} />
            </Link>
          </div>
          <a className="back-to-top" href="#top" aria-label="Back to top">
            <ArrowUp size={19} />
            <span>BACK TO TOP</span>
          </a>
        </div>
        <div className="footer-bottom">
          <p>© 2026 DevRealm.</p>
          <Link href="/terms/">Terms of Service</Link>
          <a
            href="#store"
          >
            Explore DevRealm <ArrowUpRight size={12} />
          </a>
          <span>DESIGNED TO KEEP YOU MOVING ✦</span>
        </div>
      </div>
    </footer>
  );
}
