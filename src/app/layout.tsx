import type { Metadata } from "next";
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
        url: "/spendwise.png",
        type: "image/png",
        sizes: "any",
      },
    ],
    apple: "/spendwise.png",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="FinTracka" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinTracka" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
