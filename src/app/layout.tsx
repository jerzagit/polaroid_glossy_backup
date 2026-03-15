import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Polaroid Glossy MY - Turn Your Memories Into Timeless Art",
  description: "Transform your digital photos into beautiful physical polaroid prints. Choose from multiple sizes, add custom text, and create memories that last forever.",
  keywords: ["polaroid", "photo prints", "photo printing", "custom prints", "memories", "photo gifts", "Malaysia"],
  authors: [{ name: "Polaroid Glossy MY Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Polaroid Glossy MY - Turn Your Memories Into Timeless Art",
    description: "Transform your digital photos into beautiful physical polaroid prints.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polaroid Glossy MY",
    description: "Transform your digital photos into beautiful physical polaroid prints.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <NextAuthProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </NextAuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
