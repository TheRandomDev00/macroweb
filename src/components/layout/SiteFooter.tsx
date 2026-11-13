import { ArrowUp, ArrowUpRight, MessageCircle, Youtube } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
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
                href="https://discord.com/invite/informaal"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Informaal Discord"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="https://www.youtube.com/@Informaal"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Informaal YouTube"
              >
                <Youtube size={19} />
              </a>
            </div>
          </div>
          <div className="footer-link-group">
            <h2>EXPLORE</h2>
            <a href="#store">Premium tools</a>
            <a href="#free-tools">Free tools</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-link-group">
            <h2>INFORMAAL</h2>
            <a
              href="https://www.informaal.com/guides"
              target="_blank"
              rel="noopener noreferrer"
            >
              Guides <ArrowUpRight size={12} />
            </a>
            <a
              href="https://www.informaal.com/updates"
              target="_blank"
              rel="noopener noreferrer"
            >
              Updates <ArrowUpRight size={12} />
            </a>
            <a
              href="https://www.informaal.com/download"
              target="_blank"
              rel="noopener noreferrer"
            >
              Downloads <ArrowUpRight size={12} />
            </a>
            <a
              href="https://www.informaal.com/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of service <ArrowUpRight size={12} />
            </a>
          </div>
          <a className="back-to-top" href="#top" aria-label="Back to top">
            <ArrowUp size={19} />
            <span>BACK TO TOP</span>
          </a>
        </div>
        <div className="footer-bottom">
          <p>Independent interface study. Not affiliated with Informaal.</p>
          <a
            href="https://www.informaal.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the original <ArrowUpRight size={12} />
          </a>
          <span>DESIGNED TO KEEP YOU MOVING ✦</span>
        </div>
      </div>
    </footer>
  );
}
