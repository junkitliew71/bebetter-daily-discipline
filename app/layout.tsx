import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeBetter — Daily Discipline Tracker",
  description: "A calm daily task and progress tracker for building consistency, one step at a time.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
