import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SpinMyLunch — La roulette qui décide pour toi",
    template: "%s | SpinMyLunch",
  },
  description:
    "Fini l'indécision ! SpinMyLunch te permet de choisir ton repas en 30 secondes grâce à une roulette collaborative et des votes en temps réel.",
  keywords: ["repas", "déjeuner", "roulette", "vote", "équipe", "groupe"],
  authors: [{ name: "SpinMyLunch" }],
  openGraph: {
    title: "SpinMyLunch — La roulette qui décide pour toi",
    description: "Fini l'indécision du midi !",
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1A2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
