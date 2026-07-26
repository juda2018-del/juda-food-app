import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ClientRouteGuard from "../components/ClientRouteGuard";
import FuseCustomerNav from "../components/FuseCustomerNav";
import "./globals.css";
import "./mobile-responsive.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ff5a00",
};

export const metadata: Metadata = {
  title: {
    default: "FUSE Iraq | توصيل الطعام",
    template: "%s | FUSE Iraq",
  },
  description: "اطلب وجباتك من مطاعم بغداد وتابع طلبك مباشرة عبر تطبيق FUSE Iraq.",
  applicationName: "FUSE Iraq",
  keywords: ["FUSE", "FUSE Iraq", "فيوز", "توصيل طعام", "مطاعم بغداد", "طلبات العراق"],
  appleWebApp: {
    capable: true,
    title: "FUSE",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
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
        <FuseCustomerNav />
      </body>
    </html>
  );
}
