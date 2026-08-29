"use client";

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
    <main dir="rtl" className="page">
      <section className="card">
        <div className="brand">FUSE Iraq</div>
        <p className="eyebrow">تسجيل دخول آمن</p>
        <h1>دخول حسابك</h1>
        <p className="sub">
          الصلاحية تُقرأ من Firebase، وليس من البريد أو بيانات المتصفح وحدها.
        </p>

        {currentSession ? (
          <section className="current">
            <span>الحساب الحالي</span>
            <b dir="ltr">{currentSession.email}</b>
            <strong>{roleTitle[currentSession.role]}</strong>
            <button type="button" onClick={openDashboard} disabled={busy}>
              فتح لوحة الحساب
            </button>
            <button type="button" className="secondary" onClick={handleLogout} disabled={busy}>
              تسجيل الخروج
            </button>
          </section>
        ) : (
          <form onSubmit={handleLogin}>
            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                dir="ltr"
                placeholder="name@example.com"
              />
            </label>
            <label>
              كلمة المرور
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                dir="ltr"
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>
        )}

        <div className="message">{message}</div>
        <button type="button" className="home" onClick={() => router.push("/")}>
          الرجوع للرئيسية
        </button>
      </section>

      <style jsx>{`
        :global(*){box-sizing:border-box}
        :global(body){margin:0;background:#050505}
        .page{min-height:100dvh;display:grid;place-items:center;padding:22px;background:radial-gradient(circle at top right,rgba(255,122,0,.2),transparent 38%),#050505;color:#fff;font-family:Cairo,system-ui,sans-serif}
        .card{width:min(100%,520px);border:1px solid rgba(255,255,255,.12);border-radius:32px;padding:28px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,122,0,.08));box-shadow:0 28px 80px rgba(0,0,0,.5)}
        .brand{display:inline-flex;border-radius:999px;padding:10px 16px;background:#ff7a00;color:#111;font-weight:950}
        .eyebrow{margin:24px 0 0;color:#ff9f43;font-weight:900}
        h1{margin:6px 0 8px;font-size:clamp(38px,8vw,64px);line-height:1.08}
        .sub{margin:0 0 22px;color:rgba(255,255,255,.68);line-height:1.8}
        form,label,.current{display:grid;gap:10px}
        label{font-weight:900;font-size:14px}
        input{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:17px;padding:15px;background:#090909;color:#fff;font:inherit;outline:none}
        input:focus{border-color:#ff7a00;box-shadow:0 0 0 3px rgba(255,122,0,.15)}
        button{border:0;border-radius:17px;padding:15px;background:#ff7a00;color:#111;font:inherit;font-weight:950;cursor:pointer}
        button:disabled{opacity:.55;cursor:not-allowed}
        .secondary,.home{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12)}
        .current{padding:18px;border-radius:22px;background:rgba(0,0,0,.32)}
        .current span{color:rgba(255,255,255,.58)}
        .current b{font-size:20px;overflow-wrap:anywhere}
        .current strong{color:#ff9f43}
        .message{margin-top:16px;border-radius:16px;padding:13px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.75);font-weight:800}
        .home{width:100%;margin-top:10px}
      `}</style>
    </main>
  );
}
