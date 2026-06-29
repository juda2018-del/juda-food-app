import type { Metadata } from "next";
import type { ReactNode } from "react";
import ClientRouteGuard from "../components/ClientRouteGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "FUSE Iraq",
  description: "نظام توصيل وتشغيل المطاعم",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ClientRouteGuard />
        {children}
      </body>
    </html>
  );
}
