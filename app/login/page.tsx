import Link from "next/link";
import { Suspense } from "react";
import LoginClient from "./LoginClient";
import SessionStorageBridge from "./SessionStorageBridge";

export default function LoginPage() {
  return (
    <>
      <SessionStorageBridge />
      <Suspense
        fallback={
          <main style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#050505",
            color: "#fff",
            fontFamily: "Cairo, system-ui, sans-serif"
          }}>
            جاري تحميل دخول فيوز...
          </main>
        }
      >
        <LoginClient />
      </Suspense>
      <Link
        href="/signup"
        style={{
          position: "fixed",
          insetInlineStart: "50%",
          bottom: 18,
          transform: "translateX(-50%)",
          zIndex: 20,
          padding: "11px 18px",
          borderRadius: 999,
          background: "#fff",
          color: "#111",
          textDecoration: "none",
          fontFamily: "Cairo, system-ui, sans-serif",
          fontWeight: 900,
          boxShadow: "0 12px 32px rgba(0,0,0,.28)",
          whiteSpace: "nowrap"
        }}
      >
        مستخدم جديد؟ إنشاء حساب زبون
      </Link>
    </>
  );
}
