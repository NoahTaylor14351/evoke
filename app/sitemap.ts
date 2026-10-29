import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return [
    "",
    "/shop",
    "/about",
    "/community",
    "/shop/evoke-official-jersey-black",
    "/shop/evoke-official-jersey-white",
    "/privacy",
    "/terms",
    "/shipping",
    "/returns",
    "/contact",
  ].map((path) => ({
    url: base + path,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
