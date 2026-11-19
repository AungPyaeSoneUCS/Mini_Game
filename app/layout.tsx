import type { Metadata, Viewport } from "next";
import PWAInstaller from "@/components/PWAInstaller";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Game Hub by AungPyaeSoneUCS",
  applicationName: "Neon Game Hub",
  description: "A collection of neon-themed browser games by AungPyaeSoneUCS, built with Next.js.",
  authors: [{ name: "AungPyaeSoneUCS", url: "https://github.com/AungPyaeSoneUCS" }],
  creator: "AungPyaeSoneUCS",
  publisher: "AungPyaeSoneUCS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Neon Game Hub",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        <PWAInstaller />
      </body>
    </html>
  );
}
