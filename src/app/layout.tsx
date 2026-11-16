import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { AuthProvider } from "@/context/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Curia — Modern Technical Discussion Forum",
    template: "%s | Curia",
  },
  description:
    "A dark-first, portfolio-grade technical discussion platform built with Next.js App Router, Supabase, and Gemini AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://curia.vercel.app"),
  openGraph: {
    title: "Curia — Modern Technical Discussion Forum",
    description:
      "Technical engineering discussions, architecture breakdowns, and AI-powered thread synthesis.",
    url: "https://curia.vercel.app",
    siteName: "Curia",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curia — Modern Technical Discussion Forum",
    description:
      "Technical engineering discussions, architecture breakdowns, and AI-powered thread synthesis.",
  },
  icons: {
    icon: "/favicon.ico",
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
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <AuthModal />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
