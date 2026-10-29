import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/src/config/commerce";
import { ProductDetail } from "@/src/components/shop/ProductDetail";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: `The official ${product.color.toLowerCase()} Evoke Esports jersey. $59.99 USD. View the front and back and explore pre-order details.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      images: [
        { url: product.front, width: 1254, height: 1254, alt: product.name },
      ],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.front, product.back],
    brand: { "@type": "Brand", name: "Evoke Esports" },
    color: product.color,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: product.currency.toUpperCase(),
      availability: "https://schema.org/PreOrder",
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail initialVariant={product.id} />
    </>
  );
}
