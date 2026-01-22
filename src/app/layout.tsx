import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { TRPCProvider } from '@/trpc/react'
import { Toaster } from 'sonner'
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
            {children}
            <Toaster position="bottom-right" theme="dark" />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
