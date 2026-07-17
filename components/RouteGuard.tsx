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
      "/notification-center",
    ],
    roles: ["admin"],
  },
  {
    prefixes: ["/restaurant-admin", "/restaurant-live", "/restaurants-admin"],
    roles: ["admin", "restaurant"],
  },
  {
    prefixes: ["/driver-app"],
    roles: ["admin", "driver"],
  },
  {
    prefixes: ["/live-orders"],
    roles: ["admin", "restaurant", "driver", "customer"],
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
        ? "FUSE إدارة"
        : role === "restaurant"
        ? "مطعم فيروز"
        : role === "driver"
        ? "kkkkkk"
        : "FUSE زبون",
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

  const params = new URLSearchParams(window.location.search);
  const roleFromUrl = normalizeRole(params.get("fuseRole"));
  const emailFromUrl = params.get("fuseEmail") || "";

  if (roleFromUrl !== "guest") {
    window.localStorage.setItem("fuseRole", roleFromUrl);
    window.localStorage.setItem("role", roleFromUrl);

    if (emailFromUrl) {
      window.localStorage.setItem("fuseEmail", emailFromUrl);
      window.localStorage.setItem("email", emailFromUrl);
    }

    window.history.replaceState(null, "", window.location.pathname);
    return roleFromUrl;
  }

  const rawUser = window.localStorage.getItem("fuseUser");

  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { role?: string; email?: string };
      const role = normalizeRole(parsed.role);

      if (role !== "guest") return role;

      const emailRole = roleFromEmail(parsed.email);
      if (emailRole !== "guest") return emailRole;
    } catch {}
  }

  const storedRole = normalizeRole(
    window.localStorage.getItem("fuseRole") || window.localStorage.getItem("role")
  );

  if (storedRole !== "guest") return storedRole;

  return roleFromEmail(
    window.localStorage.getItem("fuseEmail") || window.localStorage.getItem("email")
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

    if (rule.roles.includes(storedRole)) {
      setChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(fuseAuth, (user) => {
      if (!user) {
        const fallbackRole = readStoredRole();

        if (rule.roles.includes(fallbackRole)) {
          setChecking(false);
          return;
        }

        goLogin(pathname);
        return;
      }

      const firebaseRole = saveSession(user);

      if (rule.roles.includes(firebaseRole)) {
        setChecking(false);
        return;
      }

      goLogin(pathname);
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
