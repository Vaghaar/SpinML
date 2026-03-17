import type { Metadata, Viewport } from "next";
import { Providers } from "@/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:  "Spinmylunch — La roulette qui décide pour toi",
    template: "%s | Spinmylunch",
  },
  description:
    "Fini l'indécision du midi ! Spinmylunch te permet de choisir ton repas en 30 secondes grâce à une roulette collaborative et des votes en temps réel.",
  keywords: ["spinmylunch", "repas", "déjeuner", "roulette", "vote", "équipe", "groupe"],
  authors: [{ name: "Spinmylunch" }],
  openGraph: {
    title:       "Spinmylunch — La roulette qui décide pour toi",
    description: "Fini l'indécision du midi !",
    type:        "website",
    locale:      "fr_FR",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,
  themeColor:    "#06020C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Anti-FOUC : applique le thème AVANT le rendu React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('spinmylunch-theme');var d=s?JSON.parse(s):null;var t=d&&d.state&&d.state.theme?d.state.theme:'dark';document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700;800;900&family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
