"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { FUSE_LOCAL_SESSION } from "@/lib/fuse-auth";

function buildAdminSession(email: string) {
  return {
    role: "admin",
    fuseRole: "admin",
    email,
    fuseEmail: email,
    name: "FUSE Admin",
    displayName: "FUSE Admin",
    uid: "fuse-admin",
    restaurantId: "all",
    restaurantName: "FUSE",
    createdAt: new Date().toISOString(),
    source: "firebase-admin-bridge"
  };
}

export default function FuseAdminBridge({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      const email = user?.email?.trim().toLowerCase() || "";

      if (!email) {
        setReady(false);
        router.replace("/login?next=/fuse-admin");
        return;
      }

      if (email !== "admin@fuse.iq") {
        setBlockedEmail(email);
        setReady(false);
        return;
      }

      try {
        const session = buildAdminSession(email);

        localStorage.setItem(FUSE_LOCAL_SESSION, JSON.stringify(session));
        localStorage.setItem("FUSE_LOCAL_SESSION", JSON.stringify(session));
        localStorage.setItem("fuseRole", "admin");
        localStorage.setItem("fuseEmail", email);
      } catch (error) {
        console.error("FUSE admin bridge localStorage error", error);
      }

      setBlockedEmail("");
      setReady(true);
    });

    return () => unsubscribe();
  }, [router]);

  if (blockedEmail) {
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
            هذا الحساب مو أدمن
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            الحساب الحالي: <b>{blockedEmail}</b>
          </p>
          <button
            onClick={async () => {
              await signOut(firebaseAuth);
              router.replace("/login?next=/fuse-admin");
            }}
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
