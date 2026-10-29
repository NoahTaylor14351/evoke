"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/src/lib/cart/store";
export function CartLink() {
  const { lines } = useCart();
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Link
      href="/cart"
      className="header-cart-link"
      aria-label={`Shopping bag, ${quantity} ${quantity === 1 ? "item" : "items"}`}
    >
      <ShoppingBag size={18} aria-hidden="true" />
      <span className="cart-count" aria-hidden="true">
        {quantity}
      </span>
    </Link>
  );
}
