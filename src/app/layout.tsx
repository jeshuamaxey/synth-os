import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryClientProvider from "@/providers/query-client-provider";
import AuthBootstrap from "@/providers/auth-bootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synth OS",
  description: "Synth OS is a terminal-based AI audio sample playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full min-h-screen`}
      >
        <QueryClientProvider>
          <AuthBootstrap>
            {children}
          </AuthBootstrap>
        </QueryClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
