import type { Metadata } from "next";
import { socialLinks } from "@/src/config/socials";
import { PageIntro } from "@/src/content/presentation";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Evoke Esports through official community and social channels.",
};
export default function ContactPage() {
  const email = process.env.CONTACT_EMAIL;
  return (
    <main>
      <PageIntro eyebrow="GET IN TOUCH" title="LET’S CONNECT.">
        Questions about the organisation, community or official merchandise?
      </PageIntro>
      <section className="section container prose">
        <h2>Reach the organisation</h2>
        <p>
          Connect with Evoke through our official channels. For private
          enquiries, ask the staff team which contact method to use before
          sharing personal information.
        </p>
        {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
          <p>
            <a className="button" href={`mailto:${email}`}>
              {email}
            </a>
          </p>
        )}
        <div className="page-grid">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              className="card text-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
