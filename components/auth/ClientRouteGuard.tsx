"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { parseFuseRole, saveFuseSession, type FuseRole } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";
import { performFuseLogout } from "@/lib/fuse-logout";

type GuardStatus = "checking" | "allowed" | "blocked";

type ClientRouteGuardProps = {
  children: ReactNode;
  /** @deprecated Email allowlists are insecure; use allowedRoles instead. */
  allowedEmails?: string[];
  allowedRoles?: FuseRole[];
  loginPath?: string;
  guardName?: string;
};

const DEFAULT_STAFF_ROLES: FuseRole[] = ["admin", "restaurant"];

export default function ClientRouteGuard({
  children,
  allowedEmails = [],
  allowedRoles,
  loginPath = "/login",
  guardName = "FUSE Route Guard",
}: ClientRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<GuardStatus>("checking");
  const [email, setEmail] = useState("");

  const queryString = searchParams?.toString() || "";

  const currentPath = useMemo(() => {
    return `${pathname || "/"}${queryString ? `?${queryString}` : ""}`;
  }, [pathname, queryString]);

  const roles = useMemo(() => {
    if (allowedRoles && allowedRoles.length > 0) return allowedRoles;
    // Ignore legacy email allowlists for authorization decisions.
    if (allowedEmails.length > 0) return DEFAULT_STAFF_ROLES;
    return DEFAULT_STAFF_ROLES;
  }, [allowedEmails, allowedRoles]);

  const loginUrl = useMemo(() => {
    return `${loginPath}?next=${encodeURIComponent(currentPath || "/restaurant-admin")}`;
  }, [loginPath, currentPath]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      if (!nextUser) {
        setEmail("");
        setStatus("checking");
        router.replace(loginUrl);
        return;
      }

      setEmail(nextUser.email?.trim().toLowerCase() || "");

      try {
        const session = await resolveFuseSession(nextUser);
        saveFuseSession(session);
        const role = parseFuseRole(session.role);
        if (role && roles.includes(role)) {
          setStatus("allowed");
          return;
        }
        setStatus("blocked");
      } catch {
        setStatus("blocked");
      }
    });

    return () => unsubscribe();
  }, [loginUrl, roles, router]);

  if (status === "checking") {
    return (
      <main style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif"
      }}>
        <section style={{
          width: "min(420px, calc(100vw - 32px))",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          padding: 28,
          background: "linear-gradient(180deg, rgba(255,122,0,0.16), rgba(255,255,255,0.04))",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)"
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 800 }}>
            {guardName}
          </p>
          <h1 style={{ margin: "10px 0 8px", fontSize: 24 }}>
            جاري فحص تسجيل الدخول...
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
            يتم التحقق من صلاحية الحساب عبر Firebase Auth والملف الشخصي فقط.
          </p>
        </section>
      </main>
    );
  }

  if (status === "blocked") {
    return (
      <main style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif",
        padding: 20
      }}>
        <section style={{
          width: "min(520px, 100%)",
          border: "1px solid rgba(255,122,0,0.32)",
          borderRadius: 24,
          padding: 28,
          background: "rgba(255,255,255,0.06)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)"
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 800 }}>
            FUSE Access Control
          </p>
          <h1 style={{ margin: "10px 0 8px", fontSize: 24 }}>
            هذا الحساب ما عنده صلاحية للوحة المطعم
          </h1>
          <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            الحساب الحالي: <b>{email || "غير معروف"}</b>
          </p>
          <button
            onClick={() => performFuseLogout("/restaurant-admin")}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 16,
              padding: "14px 16px",
              background: "#FF7A00",
              color: "#111",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            تسجيل خروج والدخول بحساب المطعم
          </button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
