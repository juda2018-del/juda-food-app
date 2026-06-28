"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  FUSE_COOKIE_EMAIL,
  FUSE_COOKIE_NAME,
  FUSE_COOKIE_PHONE,
  FUSE_COOKIE_RESTAURANT,
  FUSE_COOKIE_ROLE,
  FUSE_LOCAL_SESSION,
  buildSession,
  findFuseAccount,
  fuseAccounts,
  roleHome,
  roleTitle,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 7) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as FuseSession;
    if (!parsed?.email || !parsed?.role) return null;

    return parsed;
  } catch {
    return null;
  }
}

function getNextPath() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  return next && next.startsWith("/") ? next : "";
}

const roleBadge: Record<FuseRole, CSSProperties> = {
  admin: {
    borderColor: "rgba(255,122,0,0.45)",
    background: "rgba(255,122,0,0.12)",
    color: "#FFB56B",
  },
  restaurant: {
    borderColor: "rgba(34,197,94,0.45)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
  },
  driver: {
    borderColor: "rgba(14,165,233,0.45)",
    background: "rgba(14,165,233,0.12)",
    color: "#7DD3FC",
  },
  customer: {
    borderColor: "rgba(168,85,247,0.45)",
    background: "rgba(168,85,247,0.12)",
    color: "#D8B4FE",
  },
};

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 32%), #050505",
    color: "white",
    padding: "28px 18px",
    fontFamily: "Arial, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
  },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  logoPill: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "12px 18px",
    background: "rgba(255,255,255,0.05)",
    fontWeight: 900,
    letterSpacing: 0.4,
  },
  homeLink: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    padding: "11px 16px",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 800,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,122,0,0.10))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    overflow: "hidden",
  },
  heroInner: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 18,
    padding: 22,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.42)",
    padding: 22,
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 900,
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(34px, 5vw, 58px)",
    lineHeight: 1.12,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  text: {
    margin: "16px 0 0",
    color: "rgba(255,255,255,0.62)",
    fontSize: 15,
    lineHeight: 1.9,
    maxWidth: 720,
  },
  form: {
    display: "grid",
    gap: 13,
    marginTop: 20,
  },
  label: {
    display: "grid",
    gap: 8,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "15px 16px",
    outline: "none",
    fontSize: 15,
  },
  primaryButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "16px 18px",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
  },
  ghostButton: {
    width: "100%",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: "15px 18px",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
  },
  demoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  demoCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 22,
    background: "rgba(255,255,255,0.04)",
    padding: 16,
    textAlign: "right",
    color: "white",
    cursor: "pointer",
  },
  badge: {
    display: "inline-flex",
    border: "1px solid",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 900,
  },
  error: {
    border: "1px solid rgba(239,68,68,0.28)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: 14,
    fontSize: 14,
    fontWeight: 800,
  },
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@fuse.iq");
  const [password, setPassword] = useState("123456");
  const [session, setSession] = useState<FuseSession | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(readSession());
  }, []);

  function saveSession(nextSession: FuseSession) {
    localStorage.setItem(FUSE_LOCAL_SESSION, JSON.stringify(nextSession));

    setCookie(FUSE_COOKIE_ROLE, nextSession.role);
    setCookie(FUSE_COOKIE_EMAIL, nextSession.email);
    setCookie(FUSE_COOKIE_NAME, nextSession.name);
    setCookie(FUSE_COOKIE_PHONE, nextSession.phone || "");
    setCookie(FUSE_COOKIE_RESTAURANT, nextSession.restaurant || "");

    setSession(nextSession);
  }

  function logout() {
    localStorage.removeItem(FUSE_LOCAL_SESSION);

    clearCookie(FUSE_COOKIE_ROLE);
    clearCookie(FUSE_COOKIE_EMAIL);
    clearCookie(FUSE_COOKIE_NAME);
    clearCookie(FUSE_COOKIE_PHONE);
    clearCookie(FUSE_COOKIE_RESTAURANT);

    setSession(null);
    router.replace("/login");
    router.refresh();
  }

  function login() {
    setError("");

    const account = findFuseAccount(email, password);

    if (!account) {
      setError("الإيميل أو كلمة المرور غير صحيحة. اختار حساب ديمو من الأسفل.");
      return;
    }

    const nextSession = buildSession(account);
    saveSession(nextSession);

    const next = getNextPath();
    router.replace(next || roleHome[nextSession.role] || "/live-orders");
    router.refresh();
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.top}>
          <div style={styles.logoPill}>FUSE Access</div>
          <Link href="/" style={styles.homeLink}>
            الرئيسية
          </Link>
        </div>

        <div style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>Login / Logout + Roles</p>

              <h1 style={styles.title}>
                دخول فيوز
                <br />
                <span style={styles.orange}>حسب الصلاحية</span>
              </h1>

              <p style={styles.text}>
                الإدارة تدخل كل النظام. المطعم يدخل لوحة المطعم والطلبات.
                السائق يدخل تطبيق السائق. الزبون يدخل الطلبات المباشرة والتتبع والتقييم،
                وما يگدر يفتح System Tools.
              </p>

              {session ? (
                <div style={{ ...styles.card, marginTop: 20, background: "rgba(34,197,94,0.08)" }}>
                  <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                    مسجل دخول حالياً
                  </p>

                  <h2 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 950 }}>
                    {session.name}
                  </h2>

                  <p style={{ margin: "7px 0 0", color: "rgba(255,255,255,0.55)", direction: "ltr" }}>
                    {session.email}
                  </p>

                  <div style={{ marginTop: 14 }}>
                    <span style={{ ...styles.badge, ...roleBadge[session.role] }}>
                      {roleTitle[session.role]}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                      marginTop: 18,
                    }}
                  >
                    <button
                      onClick={() => router.push(roleHome[session.role])}
                      style={styles.primaryButton}
                    >
                      دخول لوحتي
                    </button>

                    <button onClick={logout} style={styles.ghostButton}>
                      تسجيل خروج
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.form}>
                  <label style={styles.label}>
                    الإيميل
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      style={styles.input}
                      dir="ltr"
                      placeholder="admin@fuse.iq"
                    />
                  </label>

                  <label style={styles.label}>
                    كلمة المرور
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") login();
                      }}
                      style={styles.input}
                      dir="ltr"
                      type="password"
                      placeholder="123456"
                    />
                  </label>

                  {error ? <div style={styles.error}>{error}</div> : null}

                  <button onClick={login} style={styles.primaryButton}>
                    دخول
                  </button>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950 }}>حسابات الديمو</h2>
              <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.50)", lineHeight: 1.8 }}>
                اضغط على أي حساب حتى يتعبّى تلقائياً.
              </p>

              <div style={styles.demoGrid}>
                {fuseAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                      setError("");
                    }}
                    style={styles.demoCard}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>
                          {account.name}
                        </h3>
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "rgba(255,255,255,0.48)",
                            direction: "ltr",
                            fontSize: 13,
                          }}
                        >
                          {account.email}
                        </p>
                      </div>

                      <span style={{ ...styles.badge, ...roleBadge[account.role] }}>
                        {roleTitle[account.role]}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "12px 0 0",
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.06)",
                        padding: "9px 10px",
                        color: "rgba(255,255,255,0.46)",
                        direction: "ltr",
                        fontSize: 12,
                      }}
                    >
                      password: {account.password} / also accepts 1234
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
