"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { performFuseLogout } from "@/lib/fuse-logout";
import { saveFuseSession, type FuseRole } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";

type DriverStatus = "checking" | "allowed" | "blocked";

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function targetForRole(role: string) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver-app";
  if (role === "customer") return "/customer";
  return "/login?next=/driver";
}

export default function DriverClient() {
  const router = useRouter();

  const [status, setStatus] = useState<DriverStatus>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [resolvedRole, setResolvedRole] = useState<FuseRole | "unknown">("unknown");
  const [message, setMessage] = useState("جاري فحص حساب السائق...");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setResolvedRole("unknown");
        setStatus("checking");
        setMessage("ماكو حساب داخل. جاري تحويلك إلى دخول السائق...");
        router.replace("/login?next=/driver");
        return;
      }

      const uid = nextUser.uid;

      void (async () => {
        try {
          const session = await resolveFuseSession(nextUser);
          if (firebaseAuth.currentUser?.uid !== uid) return;

          if (session.role !== "driver") {
            setResolvedRole(session.role);
            setStatus("blocked");
            setMessage(`الحساب الحالي ${clean(nextUser.email)} مو حساب سائق.`);
            return;
          }

          saveFuseSession(session);
          setResolvedRole(session.role);
          setStatus("allowed");
          setMessage("تم تثبيت جلسة السائق بنجاح.");
        } catch (error) {
          if (firebaseAuth.currentUser?.uid !== uid) return;
          setResolvedRole("unknown");
          setStatus("blocked");
          setMessage(error instanceof Error ? error.message : "تعذر قراءة صلاحية الحساب.");
        }
      })();
    });

    return () => unsubscribe();
  }, [router]);

  if (status === "checking") {
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
            FUSE Driver Guard
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 30 }}>
            جاري فتح لوحة السائق...
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            {message}
          </p>
        </section>
      </main>
    );
  }

  if (status === "blocked") {
    const currentEmail = clean(user?.email);
    const currentRole = resolvedRole === "unknown" ? "customer" : resolvedRole;

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
          border: "1px solid rgba(255,122,0,0.30)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Driver Access
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 28 }}>
            هذا الحساب مو سائق
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            الحساب الحالي: <b>{currentEmail || "غير معروف"}</b>
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <button
              onClick={() => router.replace(targetForRole(currentRole))}
              style={{
                border: 0,
                borderRadius: 16,
                padding: "14px 18px",
                background: "#FF7A00",
                color: "#111",
                fontWeight: 950,
                cursor: "pointer"
              }}
            >
              رجوع للوحة الحساب الحالي
            </button>

            <button
              onClick={() => performFuseLogout("/driver")}
              style={{
                border: "1px solid rgba(255,120,120,0.38)",
                borderRadius: 16,
                padding: "14px 18px",
                background: "rgba(255,0,0,0.12)",
                color: "#ffb6b6",
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              تسجيل خروج والدخول بحساب السائق
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top right, rgba(255,122,0,0.20), transparent 36%), #050505",
      color: "#fff",
      fontFamily: "Cairo, system-ui, sans-serif",
      padding: 24
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
        marginBottom: 24
      }}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          padding: "14px 24px",
          fontWeight: 950,
          fontSize: 22
        }}>
          FUSE Driver
        </div>

        <button
          onClick={() => performFuseLogout("/driver")}
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            borderRadius: 999,
            padding: "13px 22px",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          تسجيل خروج
        </button>
      </header>

      <section style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,122,0,0.12))",
        borderRadius: 30,
        padding: 28
      }}>
        <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
          لوحة السائق
        </p>

        <h1 style={{
          fontSize: "clamp(42px, 7vw, 78px)",
          lineHeight: 1.15,
          margin: "12px 0 10px",
          fontWeight: 950
        }}>
          الطلبات
          <br />
          <span style={{ color: "#FF7A00" }}>والتوصيل المباشر</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 18, marginBottom: 24 }}>
          الحساب الحالي: <b dir="ltr">{user?.email}</b>
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16
        }}>
          {[
            ["الحالة", "متصل", "جاهز لاستلام الطلبات"],
            ["طلبات جديدة", "0", "لا توجد طلبات جديدة"],
            ["قيد التوصيل", "0", "لا توجد طلبات نشطة"],
            ["أرباح اليوم", "0", "دينار عراقي"]
          ].map(([title, value, caption]) => (
            <div key={title} style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.36)",
              borderRadius: 24,
              padding: 22,
              minHeight: 130
            }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.70)", fontWeight: 900 }}>
                {title}
              </p>
              <h2 style={{
                margin: "12px 0 6px",
                color: value === "متصل" ? "#7CFFB2" : "#FF7A00",
                fontSize: 36
              }}>
                {value}
              </h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.58)", lineHeight: 1.7 }}>
                {caption}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{
        marginTop: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 26,
        padding: 24
      }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>
          طلبات السائق
        </h2>

        <div style={{
          border: "1px dashed rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.28)",
          borderRadius: 22,
          padding: 24,
          color: "rgba(255,255,255,0.68)",
          lineHeight: 1.8
        }}>
          الطلبات الحية تظهر في تطبيق السائق بعد التخصيص.
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => router.push("/driver-app")}
              style={{
                border: 0,
                borderRadius: 16,
                padding: "14px 18px",
                background: "#FF7A00",
                color: "#111",
                fontWeight: 950,
                cursor: "pointer"
              }}
            >
              فتح تطبيق التوصيل
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
