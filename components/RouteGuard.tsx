"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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

function roleFromEmail(email?: string | null): FuseRole {
  const clean = (email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "guest";
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
    label:
      role === "admin"
        ? "إدارة"
        : role === "restaurant"
        ? "مطعم"
        : role === "driver"
        ? "سائق"
        : role === "customer"
        ? "زبون"
        : "زائر",
  };

  window.localStorage.setItem("fuseUser", JSON.stringify(payload));
  window.localStorage.setItem("fuseUid", user.uid);
  window.localStorage.setItem("fuseEmail", user.email || "");
  window.localStorage.setItem("fuseRole", role);
  window.localStorage.setItem("email", user.email || "");
  window.localStorage.setItem("role", role);
}

function clearSession() {
  window.localStorage.removeItem("fuseUser");
  window.localStorage.removeItem("fuseUid");
  window.localStorage.removeItem("fuseEmail");
  window.localStorage.removeItem("fuseRole");
  window.localStorage.removeItem("email");
  window.localStorage.removeItem("role");
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
  const [checking, setChecking] = useState(Boolean(rule));
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!rule) {
      setChecking(false);
      setBlocked(false);
      return;
    }

    setChecking(true);
    setBlocked(false);

    const unsubscribe = onAuthStateChanged(fuseAuth, (user) => {
      if (!user) {
        clearSession();
        window.localStorage.setItem("fuseRedirectAfterLogin", pathname);
        setBlocked(true);
        setChecking(false);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const role = roleFromEmail(user.email);
      saveSession(user, role);

      if (!rule.roles.includes(role)) {
        window.localStorage.setItem("fuseRedirectAfterLogin", pathname);
        setBlocked(true);
        setChecking(false);
        router.replace(`/login?next=${encodeURIComponent(pathname)}&blocked=1`);
        return;
      }

      setBlocked(false);
      setChecking(false);
    });

    return () => unsubscribe();
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
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>FUSE Security</p>
        <h1 style={{ margin: "12px 0", fontSize: 34 }}>فحص الصلاحيات</h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", lineHeight: 1.8 }}>
          هاي الصفحة تحتاج تسجيل دخول Firebase حقيقي. راح نحولك لصفحة الدخول.
        </p>
      </div>
    </div>
  );
}
