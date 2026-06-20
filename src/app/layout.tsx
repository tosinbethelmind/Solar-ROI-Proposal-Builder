import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SyncProvider } from "@/components/sync-provider";
import UpgradeModal from "@/components/UpgradeModal";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolarQuotePro — Proposal Builder for Nigerian Installers",
  description:
    "Offline-first PWA that auto-sizes inverters, batteries, and solar panels for Nigerian homes and businesses, then generates branded PDF proposals with ROI calculations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SolarQuotePro",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SyncProvider>
            {children}
            <UpgradeModal />
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                style: {
                  background: '#01696F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                }
              }} 
            />
          </SyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
