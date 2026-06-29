"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

type GuardStatus = "checking" | "allowed" | "blocked";

type ClientRouteGuardProps = {
  children: ReactNode;
  allowedEmails?: string[];
  loginPath?: string;
  guardName?: string;
};

export default function ClientRouteGuard({
  children,
  allowedEmails = [],
  loginPath = "/login",
  guardName = "FUSE Route Guard",
}: ClientRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<GuardStatus>("checking");
  const [user, setUser] = useState<User | null>(null);

  const queryString = searchParams?.toString() || "";

  const currentPath = useMemo(() => {
    return `${pathname || "/"}${queryString ? `?${queryString}` : ""}`;
  }, [pathname, queryString]);

  const allowedSet = useMemo(() => {
    return new Set(
      allowedEmails
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    );
  }, [allowedEmails]);

  const loginUrl = useMemo(() => {
    return `${loginPath}?next=${encodeURIComponent(currentPath || "/restaurant-admin")}`;
  }, [loginPath, currentPath]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setStatus("checking");
        router.replace(loginUrl);
        return;
      }

      const email = nextUser.email?.trim().toLowerCase() || "";

      if (allowedSet.size > 0 && !allowedSet.has(email)) {
        setUser(nextUser);
        setStatus("blocked");
        return;
      }

      setUser(nextUser);
      setStatus("allowed");
    });

    return () => unsubscribe();
  }, [allowedSet, loginUrl, router]);

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
            إذا ماكو جلسة فعّالة، راح يحولك إلى صفحة الدخول النظيفة.
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
            الحساب الحالي: <b>{user?.email || "غير معروف"}</b>
          </p>
          <button
            onClick={async () => {
              await signOut(firebaseAuth);
              router.replace(loginUrl);
            }}
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
