import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/src/components/home/hero";
import { IdentityPanels } from "@/src/components/home/identity-panels";
import { OrganizationDirectory } from "@/src/components/home/organization";
import { ProductCard } from "@/src/components/shop/ProductCard";
import { products } from "@/src/config/commerce";
import { socials } from "@/src/config/socials";
const faqs = [
  [
    "What is Evoke Esports?",
    "Evoke is a Fortnite-focused esports organisation built around competition, content and community. Established in 2026, we bring players, creators and supporters together under one name.",
  ],
  [
    "How can I join Evoke?",
    "Our Discord is the place to meet the community and find the latest information about opportunities within Evoke.",
  ],
  [
    "Can I pre-order a jersey?",
    "Both official jerseys are available for paid pre-order at $59.99 USD. Add your printed name, choose your size and add the jersey to your cart. Payment is taken at checkout; your jersey ships later under the pre-order terms.",
  ],
  [
    "Where can I follow the team?",
    "Find our official Discord, TikTok and X profiles through our Linktree, or use the links at the bottom of the page.",
  ],
];
export default function Home() {
  return (
    <main className="home-page">
      <Hero />
      <IdentityPanels />
      <OrganizationDirectory />
      <section className="section container home-collection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / OFFICIAL MERCHANDISE</span>
            <h2>
              Your colours.
              <br />
              Our identity.
            </h2>
          </div>
          <Link href="/shop" className="text-link">
            Explore the collection
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <section className="section container faq-section editorial-faq" aria-labelledby="faq-heading">
        <div>
          <span className="eyebrow">[ + FAQ ]</span>
          <h2 id="faq-heading"><span>GENERAL</span><span>QUESTIONS</span></h2>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], index) => (
            <details key={q} name="evoke-faq">
              <summary>
                <span className="faq-small-number" aria-hidden="true">{index + 1}.</span>
                <span>{q}</span>
                <span className="faq-large-number" aria-hidden="true">0{index + 1}</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="community-banner editorial-community" aria-labelledby="discord-heading">
        <div className="container">
          <span className="eyebrow">[ + LET’S TALK ]</span>
          <h2 id="discord-heading">JOIN THE<br />DISCORD</h2>
          <a className="discord-marquee" href={socials.discord} target="_blank" rel="noopener noreferrer" aria-label="Join the Evoke Discord community">
            <span className="discord-marquee-track" aria-hidden="true">
              {[0, 1].map((group) => <span className="discord-marquee-group" key={group}>{[0, 1, 2, 3].map((copy) => <span key={copy}>JOIN DISCORD <span className="discord-dot">✦</span></span>)}</span>)}
            </span>
            <span className="discord-marquee-icon"><ArrowUpRight size={21} aria-hidden="true" /></span>
          </a>
        </div>
      </section>
    </main>
  );
}
