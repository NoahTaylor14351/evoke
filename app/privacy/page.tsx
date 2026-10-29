import type { Metadata } from "next";
import { LegalPage } from "@/src/content/legal";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <LegalPage
      title="PRIVACY POLICY"
      intro="How information is handled when you visit Evoke."
    >
      <h2>Information we use</h2>
      <p>
        You can browse the website without creating an account. Organisation
        content is served from local files and no marketing mailing list or
        analytics is enabled by default.
      </p>
      <p>
        When payments are available, Stripe processes payment details. Evoke
        receives the order information needed to manage a pre-order, such as
        contact and shipping details. We do not store raw payment card details.
      </p>
      <h2>Essential storage</h2>
      <p>
        The site uses session storage to remember whether the introduction has
        played. Checkout may use an essential cookie to link a payment attempt
        to its order record and protect order access.
      </p>
      <p>
        Your cart, selected sizes and printable jersey names are stored on your
        device so they remain available across page changes and visits. You can
        remove individual items or clear the cart at any time.
      </p>
      <h2>Access and retention</h2>
      <p>
        Order records are kept on the server. The organisation must confirm its
        legal identity, privacy contact, retention schedule and applicable data
        protection procedures before launch.
      </p>
      <h2>Your information</h2>
      <p>
        Contact Evoke to ask about information held about you or request
        corrections and deletion, subject to any record-keeping requirements
        that apply.
      </p>
    </LegalPage>
  );
}
