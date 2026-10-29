import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import { Header } from "@/src/components/layout/header";
import { Footer } from "@/src/components/layout/footer";
import { MotionEnhancements } from "@/src/components/layout/motion";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Evoke Esports — Built to Compete",
    template: "%s | Evoke Esports",
  },
  description:
    "The home of Evoke Esports. Fortnite, community and the official Evoke jersey collection. Built to compete. Made to belong.",
  openGraph: {
    type: "website",
    siteName: "Evoke Esports",
    title: "Evoke Esports — Built to Compete",
    description: "Fortnite. Community. Culture. This is Evoke.",
    images: [{ url: "/assets/evoke/social.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/evoke/social.jpg"],
  },
  icons: {
    icon: "/assets/evoke/favicon.png",
    apple: "/assets/evoke/apple-touch-icon.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <Header />
        <div id="content">{children}</div>
        <Footer />
        <MotionEnhancements />
      </body>
    </html>
  );
}
