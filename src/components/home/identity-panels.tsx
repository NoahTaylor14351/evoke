import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trackerUrl } from "@/src/config/socials";

export function IdentityPanels() {
  return (
    <section className="identity-section" aria-labelledby="identity-heading">
      <div className="identity-intro container">
        <div>
          <span className="eyebrow">[ + THE ORGANISATION ]</span>
          <h2 id="identity-heading">BUILT TO COMPETE.<br />DRIVEN TO EVOKE.</h2>
        </div>
      </div>
      <div className="identity-panels">
        <Link href={trackerUrl} target="_blank" rel="noopener noreferrer" className="identity-panel identity-roster" aria-label="Explore the Evoke roster">
          <div className="identity-art" aria-hidden="true">
            <span className="identity-word">EVOKE</span>
            <img className="identity-crown" src="/assets/evoke/logo.png" alt="" width="490" height="312" />
            <img className="identity-crown-echo" src="/assets/evoke/logo.png" alt="" width="490" height="312" />
          </div>
          <div className="identity-panel-top">
            <span>[ 2026 ]<br />[ THE TEAM ]</span>
            <span className="identity-panel-cta">See roster <ArrowUpRight size={13} aria-hidden="true" /></span>
          </div>
          <h3>ROSTER</h3>
          <span className="identity-panel-bottom">THE PEOPLE BEHIND THE NAME <ArrowUpRight size={20} aria-hidden="true" /></span>
        </Link>
        <Link href="/shop" className="identity-panel identity-shop" aria-label="Shop the official Evoke jerseys">
          <div className="identity-art" aria-hidden="true">
            <img className="identity-jersey" src="/assets/evoke/shop-collection-banner.webp" alt="" width="1826" height="761" loading="lazy" />
          </div>
          <div className="identity-panel-top">
            <span>[ 2026 ]<br />[ THE COLLECTION ]</span>
            <span className="identity-panel-cta">See shop <ArrowUpRight size={13} aria-hidden="true" /></span>
          </div>
          <h3>SHOP</h3>
          <span className="identity-panel-bottom">OUR CROWN. YOUR COLOURS. <ArrowUpRight size={20} aria-hidden="true" /></span>
        </Link>
      </div>
    </section>
  );
}
