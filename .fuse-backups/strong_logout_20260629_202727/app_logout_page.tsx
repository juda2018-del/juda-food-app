 "use client";

import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    window.localStorage.removeItem("fuse_session");
    window.sessionStorage.removeItem("fuse_session");

    document.cookie =
      "fuse_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    const timer = setTimeout(() => {
      window.location.href = "/login";
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>F</div>

        <h1 style={styles.title}>تسجيل خروج</h1>

        <p style={styles.text}>
          تم مسح الجلسة والكوكي، جاري تحويلك إلى صفحة الدخول...
        </p>

        <a href="/login" style={styles.link}>
          رجوع إلى Login
        </a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(circle at 12% 8%, rgba(255,122,0,.22), transparent 32%), linear-gradient(135deg, #050505, #0d0d10 55%, #050505)",
    color: "white",
    fontFamily:
      "Cairo, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  card: {
    width: "min(560px, calc(100% - 28px))",
    borderRadius: 36,
    padding: 34,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(12,12,14,.88)",
    boxShadow: "0 24px 90px rgba(0,0,0,.36)",
  },
  logo: {
    width: 76,
    height: 76,
    margin: "0 auto 18px",
    borderRadius: 28,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #ff7a00, #ffc266)",
    color: "#050505",
    fontSize: 30,
    fontWeight: 1000,
  },
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 1000,
  },
  text: {
    margin: "12px 0 0",
    color: "rgba(255,255,255,.56)",
    lineHeight: 2,
    fontWeight: 850,
  },
  link: {
    display: "inline-block",
    marginTop: 18,
    textDecoration: "none",
    borderRadius: 999,
    padding: "13px 18px",
    color: "#050505",
    background: "linear-gradient(135deg, #ff7a00, #ffc266)",
    fontWeight: 1000,
  },
};