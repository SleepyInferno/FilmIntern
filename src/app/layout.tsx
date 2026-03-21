import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppTopNav } from "@/components/app-topnav";
import { ProjectsSidebar } from "@/components/projects-sidebar";
import { Providers } from "./providers";
import { ACCENT_FLASH_SCRIPT } from "@/lib/theme";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Film Intern",
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
            <div className="flex flex-1 overflow-hidden">
              <ProjectsSidebar />
              <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1100px] mx-auto px-8 py-6">
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
