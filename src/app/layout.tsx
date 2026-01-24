import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { TRPCProvider } from '@/trpc/react'
import { Toaster } from 'sonner'
import { OfflineBanner } from '@/components/offline-banner'
import { SkipLink } from '@/components/ui/skip-link'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css";

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "GrantSignal",
  description: "The Organizational Memory Engine for Nonprofits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className="bg-slate-900 text-slate-100 antialiased">
          <TRPCProvider>
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <OfflineBanner />
            <main id="main-content">
              {children}
            </main>
            <Toaster position="bottom-right" theme="dark" />
          </TRPCProvider>
          {/* Vercel Analytics - tracks page views and Core Web Vitals */}
          <Analytics />
          {/* Vercel Speed Insights - tracks performance metrics */}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}
