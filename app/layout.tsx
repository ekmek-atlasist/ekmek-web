import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Smartphone } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0F2540",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Ekmek",
  description:
    "Ekmek, iş arayanlarla işverenleri saniyeler içinde buluşturur.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ekmek",
  },
  other: {
    "msapplication-navbutton-color": "#0f2540",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-white flex flex-col">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="landscape-title"
          aria-describedby="landscape-desc"
          className="fixed inset-0 z-[100] hidden flex-col items-center justify-center bg-[#0f2540] px-8 text-center [@media(orientation:landscape)_and_(max-width:1023px)]:flex"
        >
          <Smartphone
            className="size-16 text-white"
            strokeWidth={1.5}
            aria-hidden
          />
          <p
            id="landscape-title"
            className="mt-6 text-2xl font-semibold text-white"
          >
            Lütfen telefonunuzu dik tutun
          </p>
          <p
            id="landscape-desc"
            className="mt-3 max-w-sm text-sm text-white/90"
          >
            Ekmek dikey modda kullanılmak için tasarlandı.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
