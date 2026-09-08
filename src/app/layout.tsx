import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "VVV Live Thesis — Venice AI Free-Float Tracker";
const description =
  "Track the live VVV investment thesis: free-float valuation, staking, DIEM locking, buy-and-burn activity, Venice growth, and relative valuation versus TAO, ZEC, NEAR and leading AI infrastructure companies.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://vvvthesis.com"),
  title,
  description,
  applicationName: "VVV Live Thesis",
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "VVV Live Thesis",
    images: [{ url: "/og", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
  ],
};

const THEME_SCRIPT = `try{var t=localStorage.getItem('vvv-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
