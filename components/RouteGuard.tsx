"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "guest";

type FuseUser = {
  email?: string;
  role?: string;
  name?: string;
};

type AccessRule = {
  prefixes: string[];
  roles: FuseRole[];
  label: string;
};

const ACCESS_RULES: AccessRule[] = [
  {
    prefixes: [
      "/fuse-admin",
      "/system-tools",
      "/drivers-admin",
      "/auto-dispatch",
      "/reports",
      "/notification-center",
    ],
    roles: ["admin"],
    label: "الإدارة",
  },
  {
    prefixes: ["/restaurant-admin", "/restaurant-live"],
    roles: ["admin", "restaurant"],
    label: "لوحة المطعم",
  },
  {
    prefixes: ["/driver-app"],
    roles: ["admin", "driver"],
    label: "تطبيق السائق",
  },
  {
    prefixes: ["/live-orders"],
    roles: ["admin", "restaurant", "driver", "customer"],
    label: "الطلبات المباشرة",
  },
];

function roleFromEmail(email?: string): FuseRole {
  const clean = (email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "guest";
}

function normalizeRole(role?: string, email?: string): FuseRole {
  const clean = (role || "").toLowerCase().trim();

  if (clean === "admin" || clean === "إدارة") return "admin";
  if (clean === "restaurant" || clean === "مطعم") return "restaurant";
  if (clean === "driver" || clean === "سائق") return "driver";
  if (clean === "customer" || clean === "زبون") return "customer";

  return roleFromEmail(email);
}

function readUser(): FuseUser {
  if (typeof window === "undefined") return {};

  const keys = ["fuseUser", "fuse_user", "currentUser", "user", "authUser"];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (!value) continue;

    try {
      const parsed = JSON.parse(value) as FuseUser;

      if (parsed?.email || parsed?.role || parsed?.name) return parsed;
    } catch {
      if (value.includes("@")) return { email: value };
    }
  }

  return {
    email:
      window.localStorage.getItem("fuseEmail") ||
      window.localStorage.getItem("email") ||
      undefined,
    role:
      window.localStorage.getItem("fuseRole") ||
      window.localStorage.getItem("role") ||
      undefined,
  };
}

function getRule(pathname: string): AccessRule | null {
  return (
    ACCESS_RULES.find((rule) =>
      rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    ) || null
  );
}

export default function RouteGuard() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const rule = useMemo(() => getRule(pathname), [pathname]);
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(Boolean(rule));

  useEffect(() => {
    if (!rule) {
      setChecking(false);
      setBlocked(false);
      return;
    }

    const user = readUser();
    const role = normalizeRole(user.role, user.email);
    const allowed = rule.roles.includes(role);

    if (!allowed) {
      window.localStorage.setItem("fuseRedirectAfterLogin", pathname);
      setBlocked(true);
      setChecking(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setBlocked(false);
    setChecking(false);
  }, [pathname, router, rule]);

  if (!rule || (!checking && !blocked)) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%), rgba(0,0,0,0.92)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 28,
          background: "rgba(255,255,255,0.06)",
          padding: 26,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>FUSE Security</p>
        <h1 style={{ margin: "12px 0", fontSize: 34 }}>فحص الصلاحيات</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
          هاي الصفحة تحتاج تسجيل دخول مناسب. راح نحولك لصفحة الدخول.
        </p>
      </div>
    </div>
  );
}
