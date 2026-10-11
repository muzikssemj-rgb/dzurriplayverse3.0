import type { Metadata, Viewport } from "next";
import "@fontsource/orbitron/600.css";
import "@fontsource/orbitron/800.css";
import "@fontsource/orbitron/900.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { SplashScreen } from "@/components/pwa/SplashScreen";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "DZURRI PLAYVERSE — One Creator. Infinite Worlds.",
    template: "%s · DZURRI PLAYVERSE",
  },
  description:
    "DZURRI PLAYVERSE — platform permainan digital oleh Dzurri. Play. Learn. Explore. Discover new games, explore exciting worlds and experience a universe of digital adventures.",
  applicationName: "DZURRI PLAYVERSE",
  authors: [{ name: "Dzurri" }],
  creator: "Dzurri",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/logo-mark.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "DZURRI", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "DZURRI PLAYVERSE",
    description: "One Creator. Infinite Worlds. — Play. Learn. Explore.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:text-space"
        >
          Skip to content
        </a>
        <SplashScreen />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
