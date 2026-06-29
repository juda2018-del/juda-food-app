"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { fuseAuth } from "../../lib/fuseAuthClient";

type FuseRole = "admin" | "restaurant" | "driver" | "customer" | "guest";

const ACCOUNTS = [
  { email: "admin@fuse.iq", role: "admin", name: "FUSE إدارة", label: "إدارة" },
  { email: "restaurant@fuse.iq", role: "restaurant", name: "مطعم فيروز", label: "مطعم" },
  { email: "driver@fuse.iq", role: "driver", name: "kkkkkk", label: "سائق" },
  { email: "customer@fuse.iq", role: "customer", name: "FUSE زبون", label: "زبون" },
] as const;

function roleFromEmail(email?: string | null): FuseRole {
  const clean = String(email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "guest";
}

function roleLabel(role: FuseRole) {
  if (role === "admin") return "إدارة";
  if (role === "restaurant") return "مطعم";
  if (role === "driver") return "سائق";
  if (role === "customer") return "زبون";
  return "زائر";
}

function dashboardFor(role: FuseRole) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver-app";
  return "/";
}

function getNextTarget(role: FuseRole) {
  if (typeof window === "undefined") return dashboardFor(role);

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || window.localStorage.getItem("fuseRedirectAfterLogin");

  if (next && !next.startsWith("/login")) return next;

  return dashboardFor(role);
}

function clearSession() {
  window.localStorage.removeItem("fuseUser");
  window.localStorage.removeItem("fuseUid");
  window.localStorage.removeItem("fuseEmail");
  window.localStorage.removeItem("fuseRole");
  window.localStorage.removeItem("email");
  window.localStorage.removeItem("role");
  window.localStorage.removeItem("fuseRedirectAfterLogin");
}

function saveSession(email: string, role: FuseRole, uid = "") {
  const payload = {
    uid,
    email,
    role,
    name:
      role === "admin"
        ? "FUSE إدارة"
        : role === "restaurant"
        ? "مطعم فيروز"
        : role === "driver"
        ? "kkkkkk"
        : "FUSE زبون",
    label: roleLabel(role),
  };

  window.localStorage.setItem("fuseUser", JSON.stringify(payload));
  window.localStorage.setItem("fuseUid", uid);
  window.localStorage.setItem("fuseEmail", email);
  window.localStorage.setItem("fuseRole", role);
  window.localStorage.setItem("email", email);
  window.localStorage.setItem("role", role);
}

function addRoleAccess(target: string, role: FuseRole, email: string) {
  const origin =
    window.location.hostname === "fuseiraq.com"
      ? "https://www.fuseiraq.com"
      : window.location.origin;

  const url = new URL(target, origin);

  url.searchParams.set("fuseRole", role);
  url.searchParams.set("fuseEmail", email);

  return url.toString();
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%), #050505",
    color: "white",
    padding: "28px 16px",
    fontFamily: "Arial, sans-serif",
  },
  shell: { width: "100%", maxWidth: 1180, margin: "0 auto" },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    padding: "12px 18px",
    color: "white",
    textDecoration: "none",
    fontWeight: 900,
  },
  panel: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.12))",
    padding: 24,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(0,0,0,0.36)",
    padding: 26,
    textAlign: "right",
  },
  eyebrow: { margin: 0, color: "#FF7A00", fontSize: 13, fontWeight: 950 },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(44px, 7vw, 76px)",
    lineHeight: 1.06,
    fontWeight: 950,
  },
  orange: { color: "#FF7A00" },
  muted: { color: "rgba(255,255,255,0.64)", lineHeight: 1.9, fontSize: 14 },
  box: {
    marginTop: 22,
    border: "1px solid rgba(255,122,0,0.18)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.26)",
    padding: 20,
  },
  input: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#050505",
    color: "white",
    padding: "16px 18px",
    outline: "none",
    fontSize: 15,
    boxSizing: "border-box",
    marginTop: 10,
    direction: "ltr",
  },
  mainButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "16px 18px",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
    marginTop: 14,
  },
  logoutButton: {
    width: "100%",
    border: "1px solid rgba(239,68,68,0.38)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.08)",
    color: "#FCA5A5",
    padding: "16px 18px",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
    marginTop: 10,
  },
  accountGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  accountButton: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.28)",
    color: "white",
    padding: 16,
    cursor: "pointer",
    textAlign: "right",
  },
  badge: {
    display: "inline-flex",
    border: "1px solid rgba(255,122,0,0.35)",
    borderRadius: 999,
    color: "#FFB56B",
    padding: "7px 10px",
    fontWeight: 950,
    fontSize: 12,
  },
  error: {
    marginTop: 12,
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 16,
    background: "rgba(239,68,68,0.10)",
    color: "#FCA5A5",
    padding: 12,
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("restaurant@fuse.iq");
  const [password, setPassword] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentRole, setCurrentRole] = useState<FuseRole>("guest");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [nextTarget, setNextTarget] = useState("/restaurant-admin");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || window.localStorage.getItem("fuseRedirectAfterLogin") || "/restaurant-admin";

    setNextTarget(next);

    const unsubscribe = onAuthStateChanged(fuseAuth, (user) => {
      if (!user) {
        setCurrentEmail("");
        setCurrentRole("guest");
        return;
      }

      const role = roleFromEmail(user.email);
      const userEmail = user.email || "";

      saveSession(userEmail, role, user.uid);
      setCurrentEmail(userEmail);
      setCurrentRole(role);
      setEmail(userEmail);
    });

    return () => unsubscribe();
  }, []);

  const nextLabel = useMemo(() => {
    if (nextTarget.includes("system-tools")) return "أدوات النظام";
    if (nextTarget.includes("restaurant-admin")) return "لوحة المطعم";
    if (nextTarget.includes("auto-dispatch")) return "التوزيع التلقائي";
    if (nextTarget.includes("driver-app")) return "تطبيق السائق";
    if (nextTarget.includes("fuse-admin")) return "لوحة الإدارة";
    return "لوحتي";
  }, [nextTarget]);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    try {
      await setPersistence(fuseAuth, browserLocalPersistence);

      const result = await signInWithEmailAndPassword(
        fuseAuth,
        email.trim(),
        password
      );

      const userEmail = result.user.email || email.trim();
      const role = roleFromEmail(userEmail);
      const target = getNextTarget(role);

      saveSession(userEmail, role, result.user.uid);

      window.location.assign(addRoleAccess(target, role, userEmail));
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "تعذر تسجيل الدخول";
      setMessage(`خطأ بتسجيل الدخول: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(fuseAuth);
    clearSession();
    setCurrentEmail("");
    setCurrentRole("guest");
    setPassword("");
    window.location.assign("/login?next=/restaurant-admin");
  }

  function enterCurrentDashboard() {
    const role = currentRole !== "guest" ? currentRole : roleFromEmail(currentEmail || email);
    const userEmail = currentEmail || email;
    const target = getNextTarget(role);

    saveSession(userEmail, role, window.localStorage.getItem("fuseUid") || "");
    window.location.assign(addRoleAccess(target, role, userEmail));
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.top}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <span style={styles.pill}>FUSE Firebase Auth</span>
        </header>

        <section style={styles.panel}>
          <div style={styles.hero}>
            <p style={styles.eyebrow}>Real Firebase Login</p>

            <h1 style={styles.title}>
              دخول فيوز
              <br />
              <span style={styles.orange}>بحساب حقيقي</span>
            </h1>

            <p style={styles.muted}>
              بعد الدخول راح يفتح مباشرة: {nextLabel}
            </p>

            <div style={styles.box}>
              <p style={{ ...styles.muted, margin: 0 }}>الحساب الحالي</p>

              <h2 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 950 }}>
                {currentEmail || "غير مسجل"}
              </h2>

              <span style={styles.badge}>{roleLabel(currentRole)}</span>

              {currentEmail ? (
                <button onClick={enterCurrentDashboard} style={styles.mainButton}>
                  دخول {nextLabel}
                </button>
              ) : null}

              {currentEmail ? (
                <button onClick={handleLogout} style={styles.logoutButton}>
                  تسجيل خروج
                </button>
              ) : null}
            </div>

            <div style={styles.box}>
              <label style={{ fontWeight: 900 }}>Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={styles.input}
                placeholder="restaurant@fuse.iq"
              />

              <label style={{ display: "block", marginTop: 14, fontWeight: 900 }}>
                Password
              </label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
                placeholder="اكتب باسورد Firebase"
                type="password"
              />

              <button disabled={loading} onClick={handleLogin} style={styles.mainButton}>
                {loading ? "جاري الدخول..." : `دخول ${nextLabel}`}
              </button>

              {message ? <div style={styles.error}>{message}</div> : null}
            </div>

            <h3 style={{ margin: "24px 0 0", fontSize: 22 }}>الحسابات</h3>

            <div style={styles.accountGrid}>
              {ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("");
                    setMessage("اكتب باسورد هذا الحساب ثم اضغط دخول.");
                  }}
                  style={styles.accountButton}
                >
                  <strong style={{ fontSize: 18 }}>{account.name}</strong>

                  <p style={{ ...styles.muted, margin: "8px 0 0", direction: "ltr" }}>
                    {account.email}
                  </p>

                  <span style={styles.badge}>{account.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
