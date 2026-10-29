import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { socials, trackerUrl } from "@/src/config/socials";
import { aboutContent } from "@/src/content";
import "./about.css";

export const metadata: Metadata = {
  title: "About Evoke",
  description:
    "Evoke Esports brings competitive Fortnite players, creators and supporters together. EST 2026.",
};

export default function AboutPage() {
  const content = aboutContent;
  return (
    <main className="about-page">
      <div className="about-shell">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <p className="about-kicker">[ ABOUT ]</p>
            <h1 id="about-title"><span>EVOKE</span><span>ESPORTS</span></h1>
            <p className="about-lede">{content.paragraphs[0]}</p>
            <p className="about-hero-detail">{content.paragraphs[1] || content.intro}</p>
            <div className="about-hero-actions">
              <a className="about-action about-action-primary" href={socials.discord} target="_blank" rel="noopener noreferrer">Join Discord <ArrowUpRight size={17} aria-hidden="true"/></a>
              <a className="about-action about-action-secondary" href={trackerUrl} target="_blank" rel="noopener noreferrer">Fortnite Tracker <ArrowUpRight size={17} aria-hidden="true"/></a>
            </div>
          </div>
          <div className="about-brand-art" role="img" aria-label={`Original Evoke Esports emblem on a purple geometric composition. ${content.established}.`}>
            <div className="about-art-plane about-art-plane-one" aria-hidden="true"/>
            <div className="about-art-plane about-art-plane-two" aria-hidden="true"/>
            <div className="about-art-plane about-art-plane-three" aria-hidden="true"/>
            <div className="about-art-grid" aria-hidden="true"/>
            <div className="about-art-caption"><span>EVOKE ESPORTS</span><span>{content.established}</span></div>
            <span className="about-art-word" aria-hidden="true">EVOKE</span>
            <img className="about-art-emblem" src="/assets/evoke/logo.png" alt="" width={600} height={600} fetchPriority="high"/>
            <div className="about-art-footer" aria-hidden="true"><span>COMPETITION / CONTENT / COMMUNITY</span><span>#OnlyEvoke</span></div>
          </div>
        </section>
        <section className="about-connect" aria-labelledby="about-connect-title">
          <div><p className="about-kicker">COMPETITION / CONTENT / COMMUNITY</p><h2 id="about-connect-title">#OnlyEvoke</h2><p>Find the official channels. Follow the journey.</p></div>
          <a href={socials.linktree} className="about-action about-action-secondary" target="_blank" rel="noopener noreferrer">All our links <ArrowUpRight size={17} aria-hidden="true"/></a>
        </section>
      </div>
    </main>
  );
}
