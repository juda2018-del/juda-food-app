import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import ClientRouteGuard from "../components/ClientRouteGuard";
import FuseCustomerNav from "../components/FuseCustomerNav";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/noto-kufi-arabic";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "./globals.css";
import "./mobile-responsive.css";
import "./fuse-customer-ui.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f5ef",
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
        <Suspense fallback={null}>
          <FuseCustomerNav />
        </Suspense>
      </body>
    </html>
  );
}
