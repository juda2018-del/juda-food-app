"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fuseAuth } from "../lib/fuseAuthClient";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "guest";

type AccessRule = {
  prefixes: string[];
  roles: FuseRole[];
};

const ACCESS_RULES: AccessRule[] = [
  {
    prefixes: [
      "/fuse-admin",
      "/system-tools",
      "/drivers-admin",
      "/auto-dispatch",
      "/reports",
      "/reels-review",
    ],
    roles: ["admin"],
  },
  {
    prefixes: [
      "/restaurant-admin",
      "/restaurant-live",
      "/restaurants-admin",
      "/restaurant-orders",
      "/restaurant-dashboard",
      "/live-orders",
    ],
    roles: ["admin", "restaurant"],
  },
  {
    prefixes: ["/restaurant-reels"],
    roles: ["admin", "restaurant", "customer"],
  },
  {
    prefixes: ["/driver-app", "/driver"],
    roles: ["admin", "driver"],
  },
];

function roleFromEmail(email?: string | null): FuseRole {
  const clean = String(email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "guest";
}

function normalizeRole(value?: string | null): FuseRole {
  const clean = String(value || "").toLowerCase().trim();
  if (clean === "admin") return "admin";
  if (clean === "restaurant") return "restaurant";
  if (clean === "driver") return "driver";
  if (clean === "customer") return "customer";
  return "guest";
}

function saveSession(user: User) {
  const email = user.email || "";
  const role = roleFromEmail(email);
  const payload = {
    uid: user.uid,
    email,
    role,
    name:
      role === "admin"
        ? "إدارة FUSE"
        : role === "restaurant"
        ? "حساب المطعم"
        : role === "driver"
        ? "سائق FUSE"
        : "زبون FUSE",
    label:
      role === "admin"
        ? "إدارة"
        : role === "restaurant"
        ? "مطعم"
        : role === "driver"
        ? "سائق"
        : "زبون",
  };

  window.localStorage.setItem("fuseUser", JSON.stringify(payload));
  window.localStorage.setItem("fuseUid", user.uid);
  window.localStorage.setItem("fuseEmail", email);
  window.localStorage.setItem("fuseRole", role);
  window.localStorage.setItem("email", email);
  window.localStorage.setItem("role", role);
  return role;
}

function readStoredRole(): FuseRole {
  if (typeof window === "undefined") return "guest";

  const rawUser = window.localStorage.getItem("fuseUser");
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { role?: string; email?: string; uid?: string };
      const emailRole = roleFromEmail(parsed.email);
      if (emailRole !== "guest" && parsed.uid) return emailRole;

      // Customer sessions may be phone/local sessions, but privileged roles are never
      // trusted from localStorage alone.
      const storedRole = normalizeRole(parsed.role);
      if (storedRole === "customer") return "customer";
    } catch {}
  }

  const storedRole = normalizeRole(
    window.localStorage.getItem("fuseRole") || window.localStorage.getItem("role")
  );
  return storedRole === "customer" ? "customer" : "guest";
}

function getRule(pathname: string): AccessRule | null {
  return (
    ACCESS_RULES.find((rule) =>
      rule.prefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
    ) || null
  );
}

function goLogin(pathname: string) {
  window.localStorage.setItem("fuseRedirectAfterLogin", pathname);
  window.location.assign(`/login?next=${encodeURIComponent(pathname)}`);
}

export default function RouteGuard() {
  const pathname = usePathname() || "/";
  const rule = useMemo(() => getRule(pathname), [pathname]);
  const [checking, setChecking] = useState(Boolean(rule));

  useEffect(() => {
    if (!rule) {
      setChecking(false);
      return;
    }

    const storedRole = readStoredRole();
    if (storedRole === "customer" && rule.roles.includes("customer")) {
      setChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(fuseAuth, (user) => {
      if (!user) {
        goLogin(pathname);
        return;
      }

      const firebaseRole = saveSession(user);
      if (rule.roles.includes(firebaseRole)) {
        setChecking(false);
        return;
      }

      const safeHome = firebaseRole === "customer" ? "/" : "/login";
      window.location.assign(safeHome);
    });

    return () => unsubscribe();
  }, [pathname, rule]);

  if (!rule || !checking) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.94)",
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
          جاري التأكد من تسجيل الدخول والصلاحية...
        </p>
      </div>
    </div>
  );
}
