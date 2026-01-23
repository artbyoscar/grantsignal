import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rover Fleet Management",
  description: "Monitor and manage your Mars rover fleet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
