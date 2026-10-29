import type { Metadata } from "next";
import { LegalPage } from "@/src/content/legal";
export const metadata: Metadata = { title: "Shipping Policy" };
export default function ShippingPage() {
  return (
    <LegalPage
      title="SHIPPING POLICY"
      intro="Delivery information for official Evoke merchandise."
    >
      <h2>Pre-order fulfilment</h2>
      <p>
        The official jerseys are pre-order merchandise. Dispatch timing has not
        been confirmed. No immediate availability or guaranteed delivery
        deadline is implied.
      </p>
      <h2>Destinations and charges</h2>
      <p>
        Shipping destinations and shipping rates require confirmation. When
        checkout is available, only supported destinations can be selected and
        the applicable charge will appear before payment.
      </p>
      <h2>Before launch</h2>
      <p>
        Evoke must publish approved fulfilment estimates, shipping destinations,
        handling procedures and contact details before accepting pre-orders.
      </p>
    </LegalPage>
  );
}
