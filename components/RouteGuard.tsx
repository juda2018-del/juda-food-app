"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { fuseAuth } from "../lib/fuseAuthClient";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "guest";

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
    prefixes: ["/restaurant-admin", "/restaurant-live", "/restaurants-admin"],
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

function roleFromEmail(email?: string | null): FuseRole {
  const clean = (email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "guest";
}

function labelFromRole(role: FuseRole) {
  if (role === "admin") return "إدارة";
  if (role === "restaurant") return "مطعم";
  if (role === "driver") return "سائق";
  if (role === "customer") return "زبون";
  return "زائر";
}

function nameFromRole(role: FuseRole) {
  if (role === "admin") return "FUSE إدارة";
  if (role === "restaurant") return "مطعم فيروز";
  if (role === "driver") return "kkkkkk";
  if (role === "customer") return "FUSE زبون";
  return "زائر";
}

function saveSession(user: User, role: FuseRole) {
  const payload = {
    uid: user.uid,
    email: user.email || "",
    role,
    name: nameFromRole(role),
    label: labelFromRole(role),
  };

  window.localStorage.setItem("fuseUser", JSON.stringify(payload));
  window.localStorage.setItem("fuseUid", user.uid);
  window.localStorage.setItem("fuseEmail", user.email || "");
  window.localStorage.setItem("fuseRole", role);
  window.localStorage.setItem("email", user.email || "");
  window.localStorage.setItem("role", role);
}

function getLocalRole(): FuseRole {
  if (typeof window === "undefined") return "guest";

  const rawUser = window.localStorage.getItem("fuseUser");

  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { email?: string; role?: string };
      const role = String(parsed.role || "").toLowerCase();

      if (role === "admin") return "admin";
      if (role === "restaurant") return "restaurant";
      if (role === "driver") return "driver";
      if (role === "customer") return "customer";

      return roleFromEmail(parsed.email);
    } catch {
      // ignore
    }
  }

  const role =
    window.localStorage.getItem("fuseRole") ||
    window.localStorage.getItem("role") ||
    "";

  if (role === "admin") return "admin";
  if (role === "restaurant") return "restaurant";
  if (role === "driver") return "driver";
  if (role === "customer") return "customer";

  return roleFromEmail(
    window.localStorage.getItem("fuseEmail") ||
      window.localStorage.getItem("email")
  );
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
  window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
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

    let finished = false;

    const localRole = getLocalRole();

    if (rule.roles.includes(localRole)) {
      setChecking(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      if (finished) return;

      const roleAfterWait = getLocalRole();

      if (rule.roles.includes(roleAfterWait)) {
        setChecking(false);
        return;
      }

      goLogin(pathname);
    }, 1800);

    const unsubscribe = onAuthStateChanged(fuseAuth, (user) => {
      finished = true;
      window.clearTimeout(timeout);

      if (!user) {
        const fallbackRole = getLocalRole();

        if (rule.roles.includes(fallbackRole)) {
          setChecking(false);
          return;
        }

        goLogin(pathname);
        return;
      }

      const firebaseRole = roleFromEmail(user.email);
      saveSession(user, firebaseRole);

      if (!rule.roles.includes(firebaseRole)) {
        goLogin(pathname);
        return;
      }

      setChecking(false);
    });

    return () => {
      finished = true;
      window.clearTimeout(timeout);
      unsubscribe();
    };
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
        background:
          "radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%), rgba(0,0,0,0.94)",
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
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
          FUSE Security
        </p>
        <h1 style={{ margin: "12px 0", fontSize: 34 }}>فحص الصلاحيات</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
          جاري التأكد من تسجيل الدخول والصلاحية...
        </p>
      </div>
    </div>
  );
}
