import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants/config";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: [
      {
        url: "/logo/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [{ url: "/logo/home-screen.png", sizes: "563x563", type: "image/png" }],
    shortcut: [
      {
        url: "/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="SpendWise" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SpendWise" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="pwa-version" content="2026-08-01-icon-v2" />
        <link rel="manifest" href="/manifest.json?v=2026-08-01-icon-v2" />
        <link rel="apple-touch-icon" sizes="563x563" href="/logo/home-screen.png" />
        <link rel="mask-icon" href="/logo/icon-512.png" color="#000000" />
        <link rel="shortcut icon" href="/logo/icon-512.png" type="image/png" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
