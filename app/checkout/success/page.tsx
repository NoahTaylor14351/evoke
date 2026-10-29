import type { Metadata } from "next";
import Confirmation from "./confirmation";
export const metadata: Metadata = {
  title: "Pre-order confirmation",
  robots: { index: false, follow: false },
};
export default function SuccessPage() {
  return <Confirmation />;
}
