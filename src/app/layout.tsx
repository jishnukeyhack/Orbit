import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — Orchestrating Autonomous Intelligence Into Action",
  description:
    "The infrastructure layer for the autonomous AI era. Create, deploy, orchestrate, and monitor AI agents at planetary scale.",
  keywords: ["AI agents", "autonomous", "swarm intelligence", "workflow builder", "AI infrastructure"],
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    apple: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
