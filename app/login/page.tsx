"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type FuseRole = "admin" | "restaurant" | "driver" | "customer";

type FuseUser = {
  email: string;
  role: FuseRole;
  name: string;
  label: string;
};

const ACCOUNTS: FuseUser[] = [
  {
    email: "admin@fuse.iq",
    role: "admin",
    name: "FUSE إدارة",
    label: "إدارة",
  },
  {
    email: "restaurant@fuse.iq",
    role: "restaurant",
    name: "مطعم فيروز",
    label: "مطعم",
  },
  {
    email: "driver@fuse.iq",
    role: "driver",
    name: "kkkkkk",
    label: "سائق",
  },
  {
    email: "customer@fuse.iq",
    role: "customer",
    name: "FUSE زبون",
    label: "زبون",
  },
];

function dashboardFor(role: FuseRole) {
  if (role === "admin") return "/fuse-admin";
  if (role === "restaurant") return "/restaurant-admin";
  if (role === "driver") return "/driver-app";
  return "/";
}

function roleFromEmail(email?: string): FuseRole {
  const clean = (email || "").toLowerCase().trim();

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";

  return "customer";
}

function roleLabel(role: FuseRole) {
  if (role === "admin") return "إدارة";
  if (role === "restaurant") return "مطعم";
  if (role === "driver") return "سائق";
  return "زبون";
}

function readCurrentUser(): FuseUser {
  if (typeof window === "undefined") return ACCOUNTS[0];

  const raw = window.localStorage.getItem("fuseUser");

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<FuseUser>;
      const email = parsed.email || "admin@fuse.iq";
      const role = (parsed.role as FuseRole) || roleFromEmail(email);

      return {
        email,
        role,
        name: parsed.name || (role === "admin" ? "FUSE إدارة" : roleLabel(role)),
        label: parsed.label || roleLabel(role),
      };
    } catch {
      // ignore bad old storage
    }
  }

  const email = window.localStorage.getItem("fuseEmail") || "admin@fuse.iq";
  const role = (window.localStorage.getItem("fuseRole") as FuseRole) || roleFromEmail(email);

  return {
    email,
    role,
    name: role === "admin" ? "FUSE إدارة" : roleLabel(role),
    label: roleLabel(role),
  };
}

function saveUser(user: FuseUser) {
  window.localStorage.setItem("fuseUser", JSON.stringify(user));
  window.localStorage.setItem("fuseEmail", user.email);
  window.localStorage.setItem("fuseRole", user.role);
  window.localStorage.setItem("email", user.email);
  window.localStorage.setItem("role", user.role);
}

function getNextTarget(role: FuseRole) {
  if (typeof window === "undefined") return dashboardFor(role);

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("next");
  const fromStorage = window.localStorage.getItem("fuseRedirectAfterLogin");

  const target = fromQuery || fromStorage || dashboardFor(role);

  window.localStorage.removeItem("fuseRedirectAfterLogin");

  if (!target || target === "/login" || target.startsWith("/login?")) {
    return dashboardFor(role);
  }

  return target;
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
  shell: {
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
  },
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
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(0,0,0,0.36)",
    padding: 26,
    textAlign: "right",
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(44px, 7vw, 76px)",
    lineHeight: 1.06,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  muted: {
    color: "rgba(255,255,255,0.64)",
    lineHeight: 1.9,
    fontSize: 14,
  },
  currentCard: {
    marginTop: 22,
    border: "1px solid rgba(34,197,94,0.28)",
    borderRadius: 28,
    background: "rgba(34,197,94,0.10)",
    padding: 20,
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
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 18,
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
};

export default function LoginPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<FuseUser>(ACCOUNTS[0]);
  const [nextTarget, setNextTarget] = useState("/");

  useEffect(() => {
    const user = readCurrentUser();
    setCurrent(user);
    setNextTarget(getNextTarget(user.role));
  }, []);

  const nextLabel = useMemo(() => {
    if (nextTarget.includes("restaurant-admin")) return "لوحة المطعم";
    if (nextTarget.includes("auto-dispatch")) return "التوزيع التلقائي";
    if (nextTarget.includes("driver-app")) return "تطبيق السائق";
    if (nextTarget.includes("fuse-admin")) return "لوحة الإدارة";
    if (nextTarget.includes("system-tools")) return "أدوات النظام";
    return "لوحتي";
  }, [nextTarget]);

  function loginAs(user: FuseUser) {
    saveUser(user);
    setCurrent(user);

    const target = getNextTarget(user.role);
    router.push(target);
  }

  function enterDashboard() {
    saveUser(current);
    const target = getNextTarget(current.role);
    router.push(target);
  }

  function logout() {
    window.localStorage.removeItem("fuseUser");
    window.localStorage.removeItem("fuseEmail");
    window.localStorage.removeItem("fuseRole");
    window.localStorage.removeItem("email");
    window.localStorage.removeItem("role");

    const guest = ACCOUNTS[3];
    setCurrent(guest);
    saveUser(guest);
    router.push("/");
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.top}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <span style={styles.pill}>FUSE Access</span>
        </header>

        <section style={styles.panel}>
          <div style={styles.hero}>
            <p style={styles.eyebrow}>Login / Logout + Roles</p>
            <h1 style={styles.title}>
              دخول فيوز
              <br />
              <span style={styles.orange}>حسب الصلاحية</span>
            </h1>
            <p style={styles.muted}>
              الإدارة تدخل كل النظام، المطعم يدخل لوحة المطعم، السائق يدخل تطبيق السائق،
              والزبون يدخل الطلبات المباشرة والتتبع والتقييم.
            </p>

            <div style={styles.currentCard}>
              <p style={{ ...styles.muted, margin: 0 }}>مسجل دخول حالياً</p>

              <h2 style={{ margin: "10px 0 0", fontSize: 34, fontWeight: 950 }}>
                {current.name}
              </h2>

              <p style={{ ...styles.muted, direction: "ltr" }}>{current.email}</p>

              <span style={styles.badge}>{current.label}</span>

              <div style={styles.actions}>
                <button onClick={enterDashboard} style={styles.mainButton}>
                  دخول {nextLabel}
                </button>

                <button onClick={logout} style={styles.logoutButton}>
                  تسجيل خروج
                </button>
              </div>
            </div>

            <h3 style={{ margin: "24px 0 0", fontSize: 22 }}>حسابات التجربة</h3>

            <div style={styles.accountGrid}>
              {ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => loginAs(account)}
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
