"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import {
  clearFuseSession,
  roleHome,
  roleTitle,
  saveFuseSession,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";

function cleanNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  if (value.startsWith("/login") || value.startsWith("/logout")) return "";
  return value;
}

function targetFor(role: FuseRole, requestedNext: string) {
  if (!requestedNext) return roleHome[role];

  const allowed: Record<FuseRole, string[]> = {
    admin: ["/"],
    restaurant: [
      "/restaurant-admin",
      "/live-orders",
      "/reports",
      "/notification-center",
    ],
    driver: ["/driver", "/driver-app", "/live-orders", "/live-tracking"],
    customer: [
      "/customer",
      "/restaurants",
      "/reels",
      "/cart",
      "/order-status",
      "/ratings",
      "/profile",
    ],
  };

  if (role === "admin") return requestedNext;
  const permitted = allowed[role].some(
    (prefix) => requestedNext === prefix || requestedNext.startsWith(`${prefix}/`)
  );
  return permitted ? requestedNext : roleHome[role];
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => cleanNext(searchParams.get("next")), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("جاري فحص الحساب الحالي...");
  const [currentSession, setCurrentSession] = useState<FuseSession | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        clearFuseSession();
        setCurrentSession(null);
        setBusy(false);
        setMessage("اكتب بريد الحساب وكلمة المرور.");
        return;
      }

      try {
        const session = await resolveFuseSession(user);
        saveFuseSession(session);
        setCurrentSession(session);
        setEmail(session.email);
        setMessage(`الحساب جاهز: ${session.email}`);
      } catch (error) {
        clearFuseSession();
        setCurrentSession(null);
        setMessage(error instanceof Error ? error.message : "تعذر قراءة صلاحية الحساب.");
      } finally {
        setBusy(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const wantedEmail = email.trim().toLowerCase();
    if (!wantedEmail || !password) {
      setMessage("اكتب البريد وكلمة المرور.");
      return;
    }

    setBusy(true);
    setMessage("جاري تسجيل الدخول...");

    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        wantedEmail,
        password
      );
      const session = await resolveFuseSession(credential.user);
      saveFuseSession(session);
      setCurrentSession(session);
      router.replace(targetFor(session.role, next));
      router.refresh();
    } catch (error) {
      clearFuseSession();
      setMessage(
        error instanceof Error && error.message.includes("FUSE")
          ? error.message
          : "فشل تسجيل الدخول. تأكد من البريد وكلمة المرور وصلاحية الحساب."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await signOut(firebaseAuth);
    } finally {
      clearFuseSession();
      setCurrentSession(null);
      setPassword("");
      setBusy(false);
      setMessage("تم تسجيل الخروج.");
    }
  }

  function openDashboard() {
    if (!currentSession) return;
    router.replace(targetFor(currentSession.role, next));
  }

  return (
    <main dir="rtl" className="fuse-auth-page">
      <section className="fuse-auth-card">
        <div className="fuse-auth-head text-center">
          <img
            src="/images/fuse-logo.png"
            alt="FUSE"
            className="fuse-auth-logo mx-auto"
          />
          <p className="fuse-auth-eyebrow">تسجيل دخول آمن</p>
          <h1>دخول حسابك</h1>
          <p className="fuse-auth-sub">
            الصلاحية تُقرأ من Firebase، وليس من البريد أو بيانات المتصفح وحدها.
          </p>
        </div>

        {currentSession ? (
          <section className="fuse-auth-panel">
            <span className="fuse-auth-panel-label">الحساب الحالي</span>
            <b dir="ltr">{currentSession.email}</b>
            <strong>{roleTitle[currentSession.role]}</strong>
            <button type="button" className="fuse-auth-submit" onClick={openDashboard} disabled={busy}>
              فتح لوحة الحساب
            </button>
            <button type="button" className="fuse-auth-secondary" onClick={handleLogout} disabled={busy}>
              تسجيل الخروج
            </button>
          </section>
        ) : (
          <form className="fuse-auth-form" onSubmit={handleLogin}>
            <label htmlFor="login-email">البريد الإلكتروني</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              dir="ltr"
              placeholder="name@example.com"
            />

            <label htmlFor="login-password">كلمة المرور</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              dir="ltr"
              placeholder="اكتب كلمة المرور"
            />

            <button type="submit" className="fuse-auth-submit" disabled={busy}>
              {busy ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>
        )}

        {message ? <p className="fuse-auth-message">{message}</p> : null}

        <Link href="/signup" className="fuse-auth-link-row">
          مستخدم جديد؟ إنشاء حساب زبون
        </Link>
        <Link href="/" className="fuse-auth-back">
          رجوع للرئيسية
        </Link>
      </section>

    </main>
  );
}
