import type { Metadata } from "next";
import { LegalPage } from "@/src/content/legal";
export const metadata: Metadata = { title: "Returns & Refunds" };
export default function ReturnsPage() {
  return (
    <LegalPage
      title="RETURNS & REFUNDS"
      intro="Clear information before you place a pre-order."
    >
      <h2>Pre-order cancellations</h2>
      <p>
        The approved pre-order cancellation procedure and any applicable
        production cut-off must be published before checkout is activated. We do
        not currently promise a particular manufacturing or dispatch date.
      </p>
      <h2>Returns and faulty items</h2>
      <p>
        The organisation must confirm its return address, returns procedure,
        refund times and treatment of any personalised merchandise. These
        details must not remove rights provided by applicable consumer law.
      </p>
      <h2>Payment questions</h2>
      <p>
        Keep your payment confirmation and order reference when contacting Evoke
        about an order. Never share your full card number or security code.
      </p>
    </LegalPage>
  );
}
