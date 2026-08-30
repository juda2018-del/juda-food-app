"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../app/firebase";
import { saveFuseSession } from "../lib/fuse-auth";
import { resolveFuseSession } from "../lib/fuse-session-resolve";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "guest";

type AccessRule = {
  prefixes: string[];
  roles: FuseRole[];
};

const ACCESS_RULES: AccessRule[] = [
  {
    prefixes: [
      "/fuse-admin",
      "/admin",
      "/admin-requests",
      "/dashboard",
      "/mission-control",
      "/operations-center",
      "/control-tower",
      "/ceo-command-center",
      "/ceo-dashboard",
      "/analytics",
      "/ai-engine",
      "/autonomous-ai",
      "/customer-intelligence",
      "/dispatch",
      "/dispatch-ai",
      "/dispatch-ai-pro",
      "/fleet-control",
      "/fleet-intelligence",
      "/fuse-ai",
      "/fuse-brain",
      "/fuse-command-live",
      "/fuse-copilot",
      "/fuse-gpt",
      "/fuse-map",
      "/fuse-os",
      "/fuse-universe",
      "/fuse-voice",
      "/ratings-admin",
      "/reports-live",
      "/smart-city-map",
      "/smart-dispatch",
      "/system-tools",
      "/drivers-admin",
      "/auto-dispatch",
      "/reels-review",
    ],
    roles: ["admin"],
  },
  {
    prefixes: ["/reports", "/notification-center"],
    roles: ["admin", "restaurant"],
  },
  {
    prefixes: [
      "/restaurant-admin",
      "/restaurant-live",
      "/restaurants-admin",
      "/restaurant-orders",
      "/restaurant-dashboard",
    ],
    roles: ["admin", "restaurant"],
  },
  {
    prefixes: ["/live-orders"],
    roles: ["admin", "restaurant", "driver", "customer"],
  },
  {
    prefixes: ["/restaurant-reels"],
    roles: ["admin", "restaurant", "customer"],
  },
  {
    prefixes: ["/driver-app", "/driver", "/live-tracking", "/live-map-tracking"],
    roles: ["admin", "driver"],
  },
];

function normalizeRole(value?: string | null): FuseRole {
  const clean = String(value || "").toLowerCase().trim();
  if (clean === "admin") return "admin";
  if (clean === "restaurant") return "restaurant";
  if (clean === "driver") return "driver";
  if (clean === "customer") return "customer";
  return "guest";
}

async function verifiedSession(user: User): Promise<FuseRole> {
  const session = await resolveFuseSession(user);
  saveFuseSession(session);
  return session.role;
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        goLogin(pathname);
        return;
      }

      const firebaseRole = await verifiedSession(user).catch(() => "guest" as FuseRole);
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
