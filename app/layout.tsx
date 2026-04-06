import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ElectronShell } from "@/components/ElectronShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sipariş Merkezi - E-ticaret Dashboard",
    template: "%s · Sipariş Merkezi",
  },
  description: "E-ticaret sipariş özeti ve platform performans takibi",
};

function ClientLogger() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.onerror = function(msg, url, line, col, error) {
            console.error('[Global Error]', msg, 'at', url, ':', line, ':', col, error);
            return false;
          };
          window.onunhandledrejection = function(event) {
            console.error('[Unhandled Rejection]', event.reason);
          };
          console.log('[ClientLogger] Global listeners initialized.');
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <ClientLogger />
        <ElectronShell />
        {children}
      </body>
    </html>
  );
}
