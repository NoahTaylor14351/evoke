import type { Metadata } from "next";
import { LegalPage } from "@/src/content/legal";
export const metadata: Metadata = { title: "Terms & Conditions" };
export default function TermsPage() {
  return (
    <LegalPage
      title="TERMS & CONDITIONS"
      intro="The terms for using Evoke and ordering official merchandise."
    >
      <h2>Using this website</h2>
      <p>
        Please use the website and community links respectfully. Official
        branding and merchandise artwork remain the property of their respective
        rights holders.
      </p>
      <h2>Merchandise and pre-orders</h2>
      <p>
        Official jersey prices are shown in US dollars. A pre-order is an
        advance payment for an item that is not ready for immediate dispatch.
        Confirmed size options, delivery estimates, shipping charges and
        applicable taxes must be presented before an order can be paid.
      </p>
      <p>
        An order is paid only when the payment processor confirms payment and a
        server record has been updated. A visit to a confirmation URL alone does
        not create an order.
      </p>
      <h2>Final terms</h2>
      <p>
        The selling organisation, jurisdiction, contact information and approved
        cancellation and refund terms must be confirmed before commerce is
        activated. Nothing in the final terms should limit statutory consumer
        rights.
      </p>
    </LegalPage>
  );
}
