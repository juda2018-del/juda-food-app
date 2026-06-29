"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

type DriverStatus = "checking" | "allowed" | "blocked";

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function roleFromEmail(email: string) {
  const e = clean(email);
  if (e === "admin@fuse.iq") return "admin";
  if (e === "restaurant@fuse.iq") return "restaurant";
  if (e === "driver@fuse.iq") return "driver";
  if (e === "customer@fuse.iq") return "customer";
  return "unknown";
}

function targetForRole(role: string) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq";
  if (role === "customer") return "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq";
  return "/login?next=/driver";
}

function writeDriverSession(email: string) {
  const session = {
    role: "driver",
    fuseRole: "driver",
    email,
    fuseEmail: email,
    uid: "fuse-driver",
    name: "FUSE Driver",
    displayName: "FUSE Driver",
    driverId: "driver-demo",
    createdAt: new Date().toISOString(),
    source: "driver-page"
  };

  try {
    localStorage.setItem("FUSE_LOCAL_SESSION", JSON.stringify(session));
    localStorage.setItem("fuseRole", "driver");
    localStorage.setItem("fuseEmail", email);
    localStorage.setItem("fuseUser", JSON.stringify(session));
  } catch (error) {
    console.error("Driver session write failed", error);
  }
}

export default function DriverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<DriverStatus>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("جاري فحص حساب السائق...");

  const urlEmail = useMemo(() => clean(searchParams.get("fuseEmail")), [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      const email = clean(nextUser?.email || urlEmail);
      const role = roleFromEmail(email);

      setUser(nextUser);

      if (!nextUser?.email) {
        setStatus("checking");
        setMessage("ماكو حساب داخل. جاري تحويلك إلى دخول السائق...");
        router.replace("/login?next=/driver");
        return;
      }

      if (role !== "driver") {
        setStatus("blocked");
        setMessage(`الحساب الحالي ${email} مو حساب سائق.`);
        return;
      }

      writeDriverSession(email);
      setStatus("allowed");
      setMessage("تم تثبيت جلسة السائق بنجاح.");
    });

    return () => unsubscribe();
  }, [router, urlEmail]);

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
    const currentRole = roleFromEmail(currentEmail);

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
              onClick={async () => {
                await signOut(firebaseAuth);
                router.replace("/login?next=/driver");
              }}
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
          onClick={async () => {
            await signOut(firebaseAuth);
            router.replace("/login?next=/driver");
          }}
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
          ماكو طلبات مخصصة للسائق حاليًا. أول ما ينربط dispatch راح تظهر الطلبات هنا مباشرة.
        </div>
      </section>
    </main>
  );
}
