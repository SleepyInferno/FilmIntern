import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Providers } from "./providers";

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
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {/* Breadcrumb bar */}
              <div className="h-12 border-b border-border flex items-center justify-between px-8 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  Projects
                </span>
                <div className="w-8 h-8 rounded-full bg-muted" />
              </div>
              {/* Main content */}
              <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1200px] mx-auto px-8 py-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
