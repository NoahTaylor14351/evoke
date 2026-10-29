import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { products } from "@/src/config/commerce";
import { ProductCard } from "@/src/components/shop/ProductCard";
import { socials } from "@/src/config/socials";

export const metadata: Metadata = {
  title: "Official Shop",
  description:
    "The official Evoke Esports jersey. Two colourways. One identity. Explore the black and white editions, each $59.99 USD.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <main className="shop-page">
      <section className="page-intro container shop-intro">
        <span className="eyebrow">EVOKE / OFFICIAL STORE</span>
        <h1>The official collection.</h1>
        <div className="shop-intro-bottom">
          <p>
            Two colourways. One identity.
            <br />
            Wear the name. Represent the community.
          </p>
          <span className="shop-intro-caption">
            THE EVOKE JERSEY
            <br />
            <strong>$59.99 USD</strong>
          </span>
        </div>
      </section>
      <section className="section container" aria-label="Official jerseys">
        <div className="shop-collection-label">
          <h2>Official jerseys</h2>
          <span>2 colourways</span>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} priority />
          ))}
        </div>
        <div className="shop-note">
          <span className="shop-status-dot" aria-hidden="true" />
          <p>
            Personalised jerseys are available for paid pre-order. Choose your
            name and size before adding your jersey to the cart. Payment is
            taken at checkout; your jersey ships later.
          </p>
          <Link href="/shipping">
            Pre-order information <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="section container shop-community">
        <div>
          <span className="eyebrow">PART OF SOMETHING BIGGER</span>
          <h2>Stay in the loop.</h2>
          <p>
            Collection updates, community conversations and everything Evoke.
          </p>
        </div>
        <Link
          className="button secondary"
          href={socials.discord}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join our Discord <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
