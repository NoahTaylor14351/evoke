import type { Metadata } from "next";
import { CartPage } from "@/src/components/cart/CartPage";
export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review and personalise your Evoke jersey pre-order.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CartPage />;
}
