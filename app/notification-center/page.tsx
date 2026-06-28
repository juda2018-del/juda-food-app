"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  roleTitle,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type NotificationDoc = {
  documentId: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  role?: string;
  restaurant?: string;
  orderId?: string;
  createdAt?: unknown;
  read?: boolean;
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);

    if (!parsed.email || !role) return null;

    return {
      ...parsed,
      role,
    };
  } catch {
    return null;
  }
}

function formatDate(value: unknown) {
  if (!value) return "بدون وقت";

  try {
    let date: Date;

    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value as string | number);
    }

    if (Number.isNaN(date.getTime())) return "بدون وقت";

    return date.toLocaleString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "بدون وقت";
  }
}

function canSeeNotification(item: NotificationDoc, role: FuseRole | null, session: FuseSession | null) {
  if (!role || !session) return false;
  if (role === "admin") return true;

  if (item.role && item.role !== role) return false;

  if (role === "restaurant" && item.restaurant && session.restaurant) {
    return item.restaurant === session.restaurant;
  }

  return role === "restaurant";
}

function typeLabel(type?: string) {
  if (!type) return "إشعار";
  if (type === "order") return "طلب";
  if (type === "driver") return "سائق";
  if (type === "system") return "نظام";
  if (type === "restaurant") return "مطعم";
  if (type === "warning") return "تنبيه";
  return type;
}

function badgeStyle(type?: string): CSSProperties {
  if (type === "warning") return styles.badgeYellow;
  if (type === "system") return styles.badgePurple;
  if (type === "driver") return styles.badgeSky;
  if (type === "order") return styles.badgeOrange;
  if (type === "restaurant") return styles.badgeGreen;
  return styles.badgeMuted;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%), #050505",
    color: "white",
    padding: "26px 16px",
    fontFamily: "Arial, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: 1160,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    padding: "11px 16px",
    color: "rgba(255,255,255,0.82)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.10))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) repeat(3, minmax(160px, 0.35fr))",
    gap: 12,
    alignItems: "stretch",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20,
  },
  compactCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    background: "rgba(0,0,0,0.34)",
    padding: 16,
    minHeight: 118,
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(36px, 5vw, 60px)",
    lineHeight: 1.08,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  muted: {
    color: "rgba(255,255,255,0.58)",
    lineHeight: 1.85,
    fontSize: 14,
  },
  statLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.52)",
    fontSize: 13,
    fontWeight: 850,
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: 30,
    fontWeight: 950,
  },
  filterBox: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1fr) minmax(200px, 0.45fr)",
    gap: 12,
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
  select: {
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
  list: {
    display: "grid",
    gap: 12,
  },
  item: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: 999,
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  badgeOrange: {
    borderColor: "rgba(255,122,0,0.42)",
    background: "rgba(255,122,0,0.12)",
    color: "#FFB56B",
  },
  badgeYellow: {
    borderColor: "rgba(234,179,8,0.42)",
    background: "rgba(234,179,8,0.12)",
    color: "#FDE68A",
  },
  badgeSky: {
    borderColor: "rgba(14,165,233,0.42)",
    background: "rgba(14,165,233,0.12)",
    color: "#7DD3FC",
  },
  badgePurple: {
    borderColor: "rgba(168,85,247,0.42)",
    background: "rgba(168,85,247,0.12)",
    color: "#D8B4FE",
  },
  badgeGreen: {
    borderColor: "rgba(34,197,94,0.42)",
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
  },
  badgeMuted: {
    borderColor: "rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.65)",
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.035)",
    padding: 28,
    textAlign: "center",
  },
};

export default function NotificationCenterPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [items, setItems] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();

    if (!saved) {
      window.location.href = "/login?next=/notification-center";
      return;
    }

    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/live-orders";
      return;
    }

    setSession(saved);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<NotificationDoc, "documentId">),
          documentId: item.id,
        }));

        setItems(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setItems([]);
        setLoading(false);
        setError(snapshotError.message || "تعذر تحميل الإشعارات");
      }
    );

    return () => unsubscribe();
  }, []);

  const role = session?.role || null;

  const visibleItems = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return items
      .filter((item) => canSeeNotification(item, role, session))
      .filter((item) => {
        const sameType = typeFilter === "الكل" || typeLabel(item.type) === typeFilter;

        const haystack = [
          item.title || "",
          item.message || "",
          item.body || "",
          item.orderId || "",
          item.restaurant || "",
          typeLabel(item.type),
        ]
          .join(" ")
          .toLowerCase();

        return sameType && (!cleanSearch || haystack.includes(cleanSearch));
      })
      .slice(0, 80);
  }, [items, role, search, session, typeFilter]);

  const unreadCount = visibleItems.filter((item) => !item.read).length;
  const warningCount = visibleItems.filter((item) => item.type === "warning").length;
  const orderCount = visibleItems.filter((item) => item.type === "order").length;

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <Link href={role ? roleHome[role] : "/login"} style={styles.pill}>
            لوحتي
          </Link>
        </div>

        <header style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>مركز الإشعارات</p>
              <h1 style={styles.title}>
                كل التنبيهات
                <br />
                <span style={styles.orange}>بمكان واحد</span>
              </h1>
              <p style={styles.muted}>
                إشعارات الطلبات، النظام، المطعم، والسائقين تظهر هنا حسب صلاحيتك.
              </p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>الدور</p>
              <p style={{ ...styles.statValue, ...styles.orange }}>
                {role ? roleTitle[role] : "—"}
              </p>
              <p style={styles.muted}>{session?.name || "غير مسجل"}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>غير مقروء</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{unreadCount}</p>
              <p style={styles.muted}>بحسب القائمة الحالية</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>طلبات / تنبيهات</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>
                {orderCount} / {warningCount}
              </p>
              <p style={styles.muted}>{loading ? "تحميل" : "مباشر"}</p>
            </div>
          </div>
        </header>

        <section style={styles.filterBox}>
          <div style={styles.filterGrid}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                بحث سريع
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.input}
                placeholder="عنوان، طلب، مطعم، رسالة..."
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                النوع
              </span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                style={styles.select}
              >
                {["الكل", "طلب", "نظام", "سائق", "مطعم", "تنبيه", "إشعار"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section style={styles.list}>
          {loading ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>جاري تحميل الإشعارات...</h2>
              <p style={styles.muted}>انتظر لحظات.</p>
            </div>
          ) : error ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0, color: "#FCA5A5" }}>تعذر تحميل الإشعارات</h2>
              <p style={styles.muted}>{error}</p>
            </div>
          ) : visibleItems.length === 0 ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>ماكو إشعارات حالياً</h2>
              <p style={styles.muted}>
                إذا وصلت طلبات أو تنبيهات جديدة راح تظهر هنا مباشرة.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <article key={item.documentId} style={styles.item}>
                <div style={styles.itemTop}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>
                        {item.title || "إشعار جديد"}
                      </h2>

                      <span style={{ ...styles.badge, ...badgeStyle(item.type) }}>
                        {typeLabel(item.type)}
                      </span>

                      {!item.read ? (
                        <span style={{ ...styles.badge, ...styles.badgeOrange }}>
                          جديد
                        </span>
                      ) : null}
                    </div>

                    <p style={styles.muted}>
                      {item.message || item.body || "بدون تفاصيل"}
                    </p>
                  </div>

                  <div style={{ textAlign: "left", minWidth: 160 }}>
                    <p style={styles.statLabel}>الوقت</p>
                    <p style={{ ...styles.muted, margin: "8px 0 0" }}>
                      {formatDate(item.createdAt)}
                    </p>
                    {item.orderId ? (
                      <p style={{ ...styles.muted, margin: "8px 0 0", direction: "ltr" }}>
                        #{item.orderId}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
