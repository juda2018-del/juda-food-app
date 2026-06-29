"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "unknown";

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function roleFromEmail(email: string): FuseRole {
  const e = clean(email);

  if (e === "admin@fuse.iq") return "admin";
  if (e === "restaurant@fuse.iq") return "restaurant";
  if (e === "driver@fuse.iq") return "driver";
  if (e === "customer@fuse.iq") return "customer";

  return "unknown";
}

function roleLabel(role: FuseRole) {
  if (role === "admin") return "إدارة";
  if (role === "restaurant") return "مطعم";
  if (role === "driver") return "سائق";
  if (role === "customer") return "زبون";
  return "غير معروف";
}

function roleButton(role: FuseRole) {
  if (role === "admin") return "دخول لوحة الإدارة";
  if (role === "restaurant") return "دخول لوحة المطعم";
  if (role === "driver") return "دخول لوحة السائق";
  if (role === "customer") return "دخول صفحة الزبون";
  return "دخول فيوز";
}

function defaultTarget(role: FuseRole) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq";
  if (role === "customer") return "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq";
  return "/";
}

function cleanNext(value: string | null) {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.startsWith("/login")) return "";
  if (value.startsWith("/logout")) return "";
  return value;
}

function targetFor(email: string, requestedNext: string) {
  const role = roleFromEmail(email);
  const nextPath = requestedNext.split("?")[0];

  if (nextPath.startsWith("/fuse-admin") || nextPath.startsWith("/admin") || nextPath.startsWith("/ceo-dashboard")) {
    return role === "admin" ? "/fuse-admin" : defaultTarget(role);
  }

  if (nextPath.startsWith("/restaurant-admin")) {
    return role === "restaurant" ? "/restaurant-admin" : defaultTarget(role);
  }

  if (nextPath.startsWith("/driver")) {
    return role === "driver" ? "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq" : defaultTarget(role);
  }

  if (nextPath.startsWith("/customer")) {
    return role === "customer" ? "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq" : defaultTarget(role);
  }

  return defaultTarget(role);
}

function defaultEmailFromNext(next: string) {
  if (next.startsWith("/fuse-admin") || next.startsWith("/admin")) return "admin@fuse.iq";
  if (next.startsWith("/driver")) return "driver@fuse.iq";
  if (next.startsWith("/customer")) return "customer@fuse.iq";
  return "restaurant@fuse.iq";
}

function writeLegacySession(email: string) {
  const role = roleFromEmail(email);

  const session = {
    role,
    fuseRole: role,
    email,
    fuseEmail: email,
    uid: `fuse-${role}`,
    name: roleLabel(role),
    displayName: roleLabel(role),
    restaurantId: role === "restaurant" ? "restaurant-demo" : role === "admin" ? "all" : "",
    restaurantName: role === "restaurant" ? "FUSE Restaurant" : role === "admin" ? "FUSE" : "",
    createdAt: new Date().toISOString(),
    source: "firebase-clean-role-login"
  };

  try {
    localStorage.setItem("FUSE_LOCAL_SESSION", JSON.stringify(session));
    localStorage.setItem("fuseRole", role);
    localStorage.setItem("fuseEmail", email);
    localStorage.setItem("fuseUser", JSON.stringify(session));
  } catch (error) {
    console.error("FUSE legacy session write failed", error);
  }
}

function clearLegacySession() {
  try {
    Object.keys(localStorage).forEach((key) => {
      const lower = key.toLowerCase();
      if (
        lower.includes("fuse") ||
        lower.includes("firebase") ||
        lower.includes("restaurant") ||
        lower.includes("driver") ||
        lower.includes("customer") ||
        lower.includes("admin")
      ) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      const lower = key.toLowerCase();
      if (
        lower.includes("fuse") ||
        lower.includes("firebase") ||
        lower.includes("restaurant") ||
        lower.includes("driver") ||
        lower.includes("customer") ||
        lower.includes("admin")
      ) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("FUSE legacy session clear failed", error);
  }
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => cleanNext(searchParams.get("next")), [searchParams]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState(defaultEmailFromNext(next));
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("جاري فحص الحساب الحالي...");

  const currentEmail = clean(currentUser?.email);
  const currentRole = roleFromEmail(currentEmail);
  const currentTarget = currentEmail ? targetFor(currentEmail, next) : "";
  const formRole = roleFromEmail(email);
  const formTarget = targetFor(email, next);

  useEffect(() => {
    setEmail(defaultEmailFromNext(next));
  }, [next]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);

      if (!user?.email) {
        setMessage("ماكو حساب داخل حاليًا. اكتب الحساب والباسورد.");
        return;
      }

      const userEmail = clean(user.email);
      writeLegacySession(userEmail);
      setEmail(userEmail);

      const target = targetFor(userEmail, next);
      setMessage(`الحساب الحالي ${userEmail} جاهز للانتقال إلى ${target}`);
    });

    return () => unsubscribe();
  }, [next]);

  async function handleLogout() {
    setBusy(true);
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error(error);
    }

    clearLegacySession();
    setCurrentUser(null);
    setPassword("");
    setEmail(defaultEmailFromNext(next));
    setMessage("تم تسجيل الخروج. ادخل بالحساب الصحيح.");
    setBusy(false);
  }

  function openCurrentTarget() {
    if (!currentEmail) return;
    writeLegacySession(currentEmail);
    router.replace(currentTarget);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const wantedEmail = clean(email);
    if (!wantedEmail) {
      setMessage("اكتب الإيميل.");
      return;
    }

    setBusy(true);
    setMessage("جاري تسجيل الدخول...");

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, wantedEmail, password);
      const signedEmail = clean(credential.user.email || wantedEmail);
      const target = targetFor(signedEmail, next);

      writeLegacySession(signedEmail);
      setMessage(`تم الدخول. جاري فتح ${target}`);
      router.replace(target);
    } catch (error) {
      console.error(error);
      setMessage("فشل تسجيل الدخول. تأكد من الإيميل والباسورد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top right, rgba(255,122,0,0.22), transparent 38%), #050505",
      color: "#fff",
      fontFamily: "Cairo, system-ui, sans-serif",
      padding: 24
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
        marginBottom: 26
      }}>
        <div style={{
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          padding: "16px 26px",
          fontWeight: 950,
          fontSize: 22
        }}>
          FUSE Firebase Auth
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,122,0,0.16)",
            color: "#fff",
            borderRadius: 999,
            padding: "14px 24px",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          الرئيسية
        </button>
      </header>

      <section style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,122,0,0.12))",
        borderRadius: 30,
        padding: 28,
        maxWidth: 1200,
        margin: "0 auto"
      }}>
        <div style={{
          border: "1px solid rgba(255,122,0,0.25)",
          background: "rgba(0,0,0,0.38)",
          borderRadius: 26,
          padding: 28
        }}>
          <p style={{ color: "#FF7A00", fontWeight: 900, margin: 0 }}>
            Real Firebase Login
          </p>

          <h1 style={{
            fontSize: "clamp(44px, 8vw, 86px)",
            lineHeight: 1.15,
            margin: "14px 0 10px",
            fontWeight: 950
          }}>
            دخول فيوز
            <br />
            <span style={{ color: "#FF7A00" }}>بحساب حقيقي</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 18, marginBottom: 24 }}>
            الوجهة المطلوبة: <b>{next || "حسب نوع الحساب"}</b>
          </p>

          {currentUser?.email ? (
            <div style={{
              border: "1px solid rgba(255,122,0,0.30)",
              borderRadius: 24,
              padding: 22,
              marginBottom: 20,
              background: "rgba(0,0,0,0.28)"
            }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.68)" }}>
                الحساب الحالي
              </p>

              <h2 style={{ margin: "8px 0", fontSize: 34, direction: "ltr" }}>
                {currentUser.email}
              </h2>

              <p style={{ margin: "0 0 8px", color: "#FF7A00", fontWeight: 900 }}>
                الدور: {roleLabel(currentRole)}
              </p>

              <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.70)", direction: "ltr" }}>
                {currentTarget}
              </p>

              <div style={{ display: "grid", gap: 12 }}>
                <button
                  onClick={openCurrentTarget}
                  style={{
                    border: 0,
                    background: "#FF7A00",
                    color: "#111",
                    borderRadius: 16,
                    padding: "15px 22px",
                    fontWeight: 950,
                    cursor: "pointer",
                    fontSize: 17
                  }}
                >
                  {roleButton(currentRole)}
                </button>

                <button
                  onClick={handleLogout}
                  disabled={busy}
                  style={{
                    border: "1px solid rgba(255,120,120,0.38)",
                    background: "rgba(255,0,0,0.12)",
                    color: "#ffb6b6",
                    borderRadius: 16,
                    padding: "15px 22px",
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: 17
                  }}
                >
                  تسجيل خروج
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleLogin} style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 24,
            padding: 22,
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 14
          }}>
            <label style={{ display: "grid", gap: 8, fontWeight: 900 }}>
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="driver@fuse.iq"
                type="email"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "#050505",
                  color: "#fff",
                  borderRadius: 16,
                  padding: "15px 16px",
                  fontSize: 18,
                  direction: "ltr"
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 8, fontWeight: 900 }}>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Firebase password"
                type="password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "#050505",
                  color: "#fff",
                  borderRadius: 16,
                  padding: "15px 16px",
                  fontSize: 18,
                  direction: "ltr"
                }}
              />
            </label>

            <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", direction: "ltr" }}>
              Target: {formTarget} | Role: {roleLabel(formRole)}
            </p>

            <button
              type="submit"
              disabled={busy}
              style={{
                border: 0,
                background: "#FF7A00",
                color: "#111",
                borderRadius: 18,
                padding: "16px 20px",
                fontWeight: 950,
                fontSize: 18,
                cursor: "pointer"
              }}
            >
              {busy ? "جاري الدخول..." : roleButton(formRole)}
            </button>

            <p style={{
              margin: 0,
              color: message.includes("فشل") ? "#ff8d8d" : "rgba(255,255,255,0.72)",
              lineHeight: 1.8
            }}>
              {message}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
