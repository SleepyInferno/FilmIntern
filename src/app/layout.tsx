import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppTopNav } from "@/components/app-topnav";
import { Providers } from "./providers";
import { ACCENT_FLASH_SCRIPT } from "@/lib/theme";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Nano Banana",
  description: "Filmmaking analysis tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_FLASH_SCRIPT }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex flex-col h-screen">
            <AppTopNav />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-[1200px] mx-auto px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
