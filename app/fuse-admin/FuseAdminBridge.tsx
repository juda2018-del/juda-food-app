"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { performFuseLogout } from "@/lib/fuse-logout";
import { FUSE_LOCAL_SESSION, saveFuseSession } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";

const LOAD_TIMEOUT_MS = 8000;

export default function FuseAdminBridge({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setError("تأخر التحقق من حساب الأدمن. حاول تسجيل الدخول مرة ثانية.");
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      window.clearTimeout(timeout);

      if (!user) {
        setReady(false);
        router.replace("/login?next=/fuse-admin");
        return;
      }

      try {
        const session = await resolveFuseSession(user);

        if (session.role !== "admin") {
          setBlockedEmail(session.email);
          setReady(false);
          return;
        }

        saveFuseSession(session);
        try {
          localStorage.setItem("FUSE_LOCAL_SESSION", JSON.stringify(session));
          localStorage.setItem(FUSE_LOCAL_SESSION, JSON.stringify(session));
        } catch {
          // localStorage may be unavailable in some WebViews.
        }

        setBlockedEmail("");
        setError("");
        setReady(true);
      } catch (resolveError) {
        setBlockedEmail(user.email?.trim().toLowerCase() || "");
        setError(resolveError instanceof Error ? resolveError.message : "تعذر التحقق من صلاحيات الأدمن.");
        setReady(false);
      }
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [router]);

  if (blockedEmail || error) {
    return (
      <main dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif",
        padding: 24
      }}>
        <section style={{
          width: "min(560px, 100%)",
          border: "1px solid rgba(255,122,0,0.32)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Admin Guard
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 28 }}>
            {blockedEmail ? "هذا الحساب مو أدمن" : "تعذر فتح لوحة الأدمن"}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            {blockedEmail ? <>الحساب الحالي: <b>{blockedEmail}</b></> : error}
          </p>
          <button
            onClick={() => performFuseLogout("/fuse-admin")}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 16,
              padding: "14px 18px",
              background: "#FF7A00",
              color: "#111",
              fontWeight: 950,
              cursor: "pointer"
            }}
          >
            تسجيل خروج والدخول بحساب الأدمن
          </button>
        </section>
      </main>
    );
  }

  if (!ready) {
    return (
      <main dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif"
      }}>
        <section style={{
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Admin Bridge
          </p>
          <h1 style={{ margin: "10px 0 0" }}>
            جاري تثبيت جلسة الأدمن...
          </h1>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
