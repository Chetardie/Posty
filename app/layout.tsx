import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Header } from "@/components/header";

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
  title: "Posty",
  description: "Posty is a social media platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              {children}
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
