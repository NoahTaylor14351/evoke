import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};
export default function CancelledPage() {
  return (
    <main className="confirmation-page container">
      <section className="confirmation-card">
        <span className="confirmation-symbol">
          <ShoppingBag size={36} strokeWidth={1.3} />
        </span>
        <span className="eyebrow">EVOKE / YOUR BAG IS SAVED</span>
        <h1>Whenever you’re ready.</h1>
        <p className="confirmation-intro">
          You’ve left checkout. Your personalised jerseys are still in your bag,
          ready to review or edit.
        </p>
        <div className="confirmation-actions">
          <Link href="/cart" className="button">
            Return to your bag
            <ArrowUpRight size={17} />
          </Link>
          <Link href="/shop" className="button secondary">
            Continue shopping
          </Link>
        </div>
        <p className="confirmation-support">
          Questions before ordering? <Link href="/contact">Talk to Evoke</Link>.
        </p>
      </section>
    </main>
  );
}
