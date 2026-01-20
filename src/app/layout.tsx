import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import "./globals.css";

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
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
