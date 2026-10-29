import { NavigationLink as Link } from "./navigation-link";
import { ArrowUpRight } from "lucide-react";
import { socials, trackerUrl } from "@/src/config/socials";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark">
            <img
              src="/assets/evoke/logo.png"
              alt="Evoke emblem"
              width="46"
              height="30"
            />
            <span>
              EVOKE<span className="brand-sub">ESPORTS</span>
            </span>
          </Link>
          <p>
            Built to compete. Connected by community.
            <br />A new generation of Fortnite esports.
          </p>
          <span className="eyebrow">EST 2026 / ALWAYS EVOKE</span>
        </div>
        <div>
          <h3>Explore</h3>
          {[
            [trackerUrl, "Our roster"],
            ["/about", "The organisation"],
          ].map(([href, label]) => (
            <Link key={href} href={href} target={href === trackerUrl ? "_blank" : undefined} rel={href === trackerUrl ? "noopener noreferrer" : undefined}>
              {label}
            </Link>
          ))}
        </div>
        <div>
          <h3>Community</h3>
          {Object.entries(socials).map(([name, url]) => (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer">
              {name === "x"
                ? "X / Twitter"
                : name === "tiktok"
                  ? "TikTok"
                  : name === "linktree"
                    ? "Linktree"
                    : "Discord"}
              <ArrowUpRight size={12} />
            </a>
          ))}
        </div>
        <div>
          <h3>Official store</h3>
          <Link href="/shop">All merchandise</Link>
          <Link href="/cart">Shopping cart</Link>
          <Link href="/shop/evoke-official-jersey-black">Black jersey</Link>
          <Link href="/shop/evoke-official-jersey-white">White jersey</Link>
          <Link href="/shipping">Shipping & delivery</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Evoke Esports. All rights reserved.
        </span>
        <div>
          {[
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
            ["/returns", "Returns"],
            ["/contact", "Contact"],
          ].map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
        <span className="footer-signoff">BUILT TO COMPETE. ↗</span>
      </div>
    </footer>
  );
}
