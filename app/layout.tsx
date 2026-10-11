import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Poppins } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://dilanka-piyumi.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dilanka & Piyumi | Wedding Invitation",
  description: "Together with their families, request the honour of your presence.",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Dilanka & Piyumi Wedding",
    title: "Dilanka & Piyumi | Wedding Invitation",
    description: "Together with their families, request the honour of your presence.",
    images: [
      {
        url: "/og-image.png",
        width: 1732,
        height: 908,
        alt: "Dilanka & Piyumi Wedding Invitation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dilanka & Piyumi | Wedding Invitation",
    description: "Together with their families, request the honour of your presence.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${cormorant.variable} ${poppins.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
