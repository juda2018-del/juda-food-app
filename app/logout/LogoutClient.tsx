"use client";

import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

function cleanNext(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.startsWith("/logout")) return "/";
  return value;
}

export default function LogoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = cleanNext(searchParams.get("next"));

    async function runLogout() {
      try {
        await signOut(firebaseAuth);
      } catch (error) {
        console.error("Firebase signOut failed", error);
      }

      try {
        const keysToRemove = [
          "FUSE_LOCAL_SESSION",
          "fuseRole",
          "fuseEmail",
          "fuseUser",
          "fuseSession",
          "fuseRestaurant",
          "fuseRestaurantId",
          "firebase:authUser",
        ];

        for (const key of keysToRemove) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }

        Object.keys(localStorage).forEach((key) => {
          const lower = key.toLowerCase();
          if (
            lower.includes("firebase") ||
            lower.includes("fuse") ||
            lower.includes("restaurant") ||
            lower.includes("admin") ||
            lower.includes("driver") ||
            lower.includes("customer")
          ) {
            localStorage.removeItem(key);
          }
        });

        Object.keys(sessionStorage).forEach((key) => {
          const lower = key.toLowerCase();
          if (
            lower.includes("firebase") ||
            lower.includes("fuse") ||
            lower.includes("restaurant") ||
            lower.includes("admin") ||
            lower.includes("driver") ||
            lower.includes("customer")
          ) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error("Storage clear failed", error);
      }

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }

    runLogout();
  }, [router, searchParams]);

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
