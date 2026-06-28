"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";

type FuseRole = "admin" | "restaurant" | "driver" | "customer";

type FuseSession = {
  role?: FuseRole;
  roleLabel?: string;
  name?: string;
  email?: string;
  route?: string;
  loginAt?: number;
};

const publicRoutes = ["/", "/login", "/logout"];

const customerRoutes = ["/live-orders", "/order-status", "/ratings"];

const restaurantRoutes = ["/restaurant-live", "/menu-live"];

const driverRoutes = ["/driver-live"];

const adminRoutes = [
  "/fuse-command-live",
  "/reports-live",
  "/restaurants-admin",
  "/drivers-admin",
  "/auto-dispatch",
  "/notification-center",
  "/system-tools",
  "/revenue-center",
  "/smart-city-map",
  "/smart-dispatch",
  "/system-monitor",
  "/uber-dashboard",
  "/customer-intelligence",
];

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function roleHome(role?: FuseRole) {
  if (role === "admin") return "/fuse-command-live";
  if (role === "restaurant") return "/restaurant-live";
  if (role === "driver") return "/driver-live";
  if (role === "customer") return "/live-orders";

  return "/login";
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const cookies = document.cookie.split(";").map((item) => item.trim());
  const target = cookies.find((item) => item.startsWith(`${name}=`));

  if (!target) return "";

  return decodeURIComponent(target.split("=").slice(1).join("="));
}

function loadSession(): FuseSession | null {
  try {
    const localSaved = window.localStorage.getItem("fuse_session");
    if (localSaved) return JSON.parse(localSaved);

    const sessionSaved = window.sessionStorage.getItem("fuse_session");
    if (sessionSaved) return JSON.parse(sessionSaved);

    const cookieSaved = readCookie("fuse_session");
    if (cookieSaved) return JSON.parse(cookieSaved);

    return null;
  } catch {
    return null;
  }
}

function isProtectedRoute(pathname: string) {
  return (
    startsWithAny(pathname, adminRoutes) ||
    startsWithAny(pathname, restaurantRoutes) ||
    startsWithAny(pathname, driverRoutes) ||
    startsWithAny(pathname, customerRoutes)
  );
}

function isAllowed(role: FuseRole | undefined, pathname: string) {
  if (!role) return false;

  if (role === "admin") {
    return (
      startsWithAny(pathname, adminRoutes) ||
      startsWithAny(pathname, restaurantRoutes) ||
      startsWithAny(pathname, driverRoutes) ||
      startsWithAny(pathname, customerRoutes)
    );
  }

  if (role === "restaurant") {
    return startsWithAny(pathname, restaurantRoutes);
  }

  if (role === "driver") {
    return startsWithAny(pathname, driverRoutes);
  }

  if (role === "customer") {
    return startsWithAny(pathname, customerRoutes);
  }

  return false;
}

function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const path = normalizePath(pathname || "/");

    if (startsWithAny(path, publicRoutes)) {
      setReady(true);
      return;
    }

    if (!isProtectedRoute(path)) {
      setReady(true);
      return;
    }

    const session = loadSession();

    if (!session?.role) {
      window.location.replace(`/login?next=${encodeURIComponent(path)}`);
      return;
    }

    if (!isAllowed(session.role, path)) {
      window.location.replace(roleHome(session.role));
      return;
    }

    setReady(true);
  }, [pathname]);

  if (!ready) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#050505",
          color: "#FF7A00",
          fontFamily: "Cairo, system-ui, sans-serif",
          fontWeight: 1000,
        }}
      >
        جاري فحص الصلاحيات...
      </main>
    );
  }

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}