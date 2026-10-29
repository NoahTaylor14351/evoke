import type { Metadata } from "next";
import { ArrowUpRight, Radio } from "lucide-react";
import { PageIntro } from "@/src/content/presentation";
import { socials, socialLinks } from "@/src/config/socials";
export const metadata: Metadata = {
  title: "Community",
  description:
    "Find the official Evoke Esports Discord, Linktree, TikTok and X channels. Your community starts here.",
};
export default function CommunityPage() {
  return (
    <main>
      <PageIntro eyebrow="FIND YOUR PEOPLE" title="YOUR COMMUNITY STARTS HERE.">
        Join the conversation. Follow the journey. Be part of Evoke.
      </PageIntro>
      <section className="section container">
        <div className="empty-state">
          <Radio size={40} strokeWidth={1.2} aria-hidden="true" />
          <p className="eyebrow">THE HOME OF EVOKE</p>
          <h2>There is a place for you here.</h2>
          <p>
            Our Discord brings players, creators and supporters together.
            Connect with the community and look out for official recruitment and
            organisation announcements.
          </p>
          <a
            className="button"
            href={socials.discord}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Discord <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="page-grid social-grid">
          {socialLinks.map((link, index) => (
            <a
              className="card social-card"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              key={link.label}
            >
              <p className="eyebrow">0{index + 1} / OFFICIAL CHANNEL</p>
              <h2>{link.label}</h2>
              <p>
                {
                  {
                    Discord: "The conversation starts here.",
                    Linktree: "Every official link, in one place.",
                    TikTok: "Follow the moments as they happen.",
                    X: "The latest from the organisation.",
                  }[link.label]
                }
              </p>
              <ArrowUpRight size={22} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
