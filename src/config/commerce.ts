export type VariantId = "black" | "white";
export const commerce = {
  checkoutEnabled: true,
  preordersEnabled: true,
  currency: "usd",
  quantityLimit: 5,
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
} as const;
export const products = (["black", "white"] as const).map((id) => ({
  id,
  slug: `evoke-official-jersey-${id}`,
  name: `Evoke Official Jersey — ${id === "black" ? "Black" : "White"}`,
  color: id === "black" ? "Black" : "White",
  price: 5999,
  currency: "usd" as const,
  availability: "preorder" as const,
  front: `/assets/evoke/jersey-${id}-front.webp`,
  back: `/assets/evoke/jersey-${id}-back.webp`,
}));
export type Product = (typeof products)[number];
export const getProduct = (id: string) =>
  products.find((product) => product.id === id || product.slug === id);
export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
