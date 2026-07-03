import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PlayerHost } from "@/components/player/PlayerHost";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ZeRo youtip",
    template: "%s · ZeRo youtip",
  },
  description: "Écouter moins. Apprendre mieux. Agir davantage.",
  applicationName: "ZeRo youtip",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeRo youtip",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "ZeRo youtip",
    title: "ZeRo youtip",
    description: "Écouter moins. Apprendre mieux. Agir davantage.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "ZeRo youtip",
    description: "Écouter moins. Apprendre mieux. Agir davantage.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <Providers>
          {children}
          <PlayerHost />
        </Providers>
      </body>
    </html>
  );
}
