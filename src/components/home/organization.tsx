import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { socials, trackerUrl } from "@/src/config/socials";

const rows = [
  {
    title: "ROSTER",
    href: trackerUrl,
    lines: ["Competitive teams", "Player development"],
  },
  {
    title: "ABOUT",
    href: "/about",
    lines: ["Our identity", "What drives Evoke"],
  },
  {
    title: "SHOP",
    href: "/shop",
    lines: ["Apparel and essentials", "Wear the identity"],
  },
  {
    title: "TRACKER",
    href: trackerUrl,
    lines: ["Updates and results", "Follow the progress"],
  },
  {
    title: "DISCORD",
    href: socials.discord,
    lines: ["Community hub", "Join the conversation"],
  },
];

export function OrganizationDirectory() {
  return (
    <section
      id="organisation"
      className="org-section"
      aria-labelledby="org-heading"
    >
      <div className="container">
        <div className="org-eyebrow">+ INSIDE EVOKE</div>
        <div className="org-heading-row">
          <h2 id="org-heading" className="org-heading">
            <span>OUR</span>
            <span>ORG</span>
          </h2>
          <span className="org-count">(05)</span>
        </div>
        <nav className="org-directory" aria-label="Explore Evoke">
          {rows.map((row, index) => (
            <Link
              className="org-row"
              key={row.title}
              href={row.href}
              aria-label={`${row.title}: ${row.lines.join('. ')}`}
              {...(row.href.startsWith("https:")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="org-number">(0{index + 1})</span>
              <span className="org-title-window" aria-hidden="true">
                <span className="org-title-track">
                  {[0, 1, 2, 3].map((copy) => <span className="org-title" key={copy}>{row.title}&nbsp;</span>)}
                </span>
              </span>
              <span className="org-description">
                {row.lines[0]}
                <br />
                {row.lines[1]}
              </span>
              <ArrowUpRight
                className="org-arrow"
                size={29}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
