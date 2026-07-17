"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { performFuseLogout } from "@/lib/fuse-logout";

function cleanNext(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.startsWith("/logout")) return "/";
  return value;
}

export default function LogoutClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = cleanNext(searchParams.get("next"));

    performFuseLogout(next);
  }, [searchParams]);

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
        width: "min(520px, 100%)",
        border: "1px solid rgba(255,122,0,0.28)",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 24,
        padding: 28,
        textAlign: "center"
      }}>
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
          FUSE Logout
        </p>
        <h1 style={{ margin: "12px 0", fontSize: 30 }}>
          جاري تنظيف الجلسة القديمة...
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
          راح نطلعك من حساب المطعم ونرجعك للدخول بالحساب الصحيح.
        </p>
      </section>
    </main>
  );
}
