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

type OrderDoc = {
  documentId: string;
  customerName?: string;
  customer?: string;
  name?: string;
  phone?: string;
  customerPhone?: string;
  restaurant?: string;
  restaurantName?: string;
  total?: number;
  amount?: number;
  status?: string;
  driverName?: string;
  createdAt?: unknown;
};

type RatingDoc = {
  documentId: string;
  restaurant?: string;
  restaurantRating?: number;
  driverRating?: number;
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  try {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }

    if (value instanceof Date) return value;

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function formatDate(value: unknown) {
  const date = toDate(value);
  if (!date) return "بدون وقت";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

function getRestaurant(order: OrderDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "—";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function canSeeOrder(order: OrderDoc, role: FuseRole | null, session: FuseSession | null) {
  if (!role || !session) return false;
  if (role === "admin") return true;
  if (role === "restaurant") {
    if (!session.restaurant) return true;
    return getRestaurant(order) === session.restaurant;
  }
  return false;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function statusStyle(status?: string): CSSProperties {
  const clean = normalizeStatus(status);

  if (clean === "جديد") return styles.badgeOrange;
  if (clean === "قيد التحضير") return styles.badgeYellow;
  if (clean === "جاهز للتوصيل") return styles.badgeSky;
  if (clean === "قيد التوصيل") return styles.badgePurple;
  if (clean === "تم التسليم") return styles.badgeGreen;
  if (clean === "مرفوض") return styles.badgeRed;

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
    maxWidth: 1200,
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
    gridTemplateColumns: "minmax(0, 1fr) repeat(4, minmax(150px, 0.32fr))",
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
    gridTemplateColumns: "minmax(220px, 1fr) minmax(170px, 0.42fr)",
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
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.45fr)",
    gap: 14,
    marginBottom: 16,
  },
  section: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 25,
    fontWeight: 950,
  },
  table: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(170px, 1fr) 130px 140px",
    gap: 10,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
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
  badgeRed: {
    borderColor: "rgba(239,68,68,0.42)",
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
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

export default function ReportsPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [ratings, setRatings] = useState<RatingDoc[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = readSession();

    if (!saved) {
      window.location.href = "/login?next=/reports";
      return;
    }

    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/live-orders";
      return;
    }

    setSession(saved);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        }));

        setOrders(data);
        setLoading(false);
      },
      () => {
        setOrders([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "ratings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<RatingDoc, "documentId">),
          documentId: item.id,
        }));

        setRatings(data);
      },
      () => setRatings([])
    );

    return () => unsubscribe();
  }, []);

  const role = session?.role || null;

  const visibleOrders = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return orders
      .filter((order) => canSeeOrder(order, role, session))
      .filter((order) => statusFilter === "الكل" || normalizeStatus(order.status) === statusFilter)
      .filter((order) => {
        if (!cleanSearch) return true;

        const haystack = [
          getCustomer(order),
          getPhone(order),
          getRestaurant(order),
          order.driverName || "",
          order.documentId,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(cleanSearch);
      });
  }, [orders, role, search, session, statusFilter]);

  const deliveredOrders = visibleOrders.filter((order) => normalizeStatus(order.status) === "تم التسليم");
  const activeOrders = visibleOrders.filter((order) => {
    const status = normalizeStatus(order.status);
    return status !== "تم التسليم" && status !== "مرفوض";
  });

  const revenue = deliveredOrders.reduce((sum, order) => sum + getTotal(order), 0);
  const averageOrderValue = deliveredOrders.length ? revenue / deliveredOrders.length : 0;

  const ratingsForRole = useMemo(() => {
    if (role === "admin") return ratings;

    if (role === "restaurant" && session?.restaurant) {
      return ratings.filter((rating) => rating.restaurant === session.restaurant);
    }

    return ratings;
  }, [ratings, role, session]);

  const avgRestaurantRating = average(ratingsForRole.map((rating) => Number(rating.restaurantRating || 0)));
  const avgDriverRating = average(ratingsForRole.map((rating) => Number(rating.driverRating || 0)));

  const latestOrders = visibleOrders.slice(0, 12);

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.pill}>الرئيسية</Link>
          <Link href={role ? roleHome[role] : "/login"} style={styles.pill}>لوحتي</Link>
        </div>

        <header style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>التقارير</p>
              <h1 style={styles.title}>
                ملخص
                <br />
                <span style={styles.orange}>الأداء والمبيعات</span>
              </h1>
              <p style={styles.muted}>
                تقرير مباشر للطلبات والمبيعات والتقييمات حسب صلاحيتك الحالية.
              </p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>الدور</p>
              <p style={{ ...styles.statValue, ...styles.orange }}>{role ? roleTitle[role] : "—"}</p>
              <p style={styles.muted}>{session?.name || "غير مسجل"}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>المبيعات</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{revenue.toLocaleString()}</p>
              <p style={styles.muted}>دينار عراقي</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>الطلبات</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{visibleOrders.length}</p>
              <p style={styles.muted}>نشطة: {activeOrders.length}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>التقييم</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{avgRestaurantRating.toFixed(1)}</p>
              <p style={styles.muted}>السائق: {avgDriverRating.toFixed(1)}</p>
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
                placeholder="زبون، هاتف، مطعم، سائق..."
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                الحالة
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.select}
              >
                {["الكل", "جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم", "مرفوض"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {loading ? (
          <div style={styles.empty}>
            <h2 style={{ margin: 0 }}>جاري تحميل التقرير...</h2>
            <p style={styles.muted}>انتظر لحظات.</p>
          </div>
        ) : (
          <section style={styles.sectionGrid}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>آخر الطلبات</h2>

              <div style={styles.table}>
                {latestOrders.length === 0 ? (
                  <div style={styles.empty}>
                    <h3 style={{ margin: 0 }}>ماكو طلبات مطابقة</h3>
                  </div>
                ) : (
                  latestOrders.map((order) => (
                    <div key={order.documentId} style={styles.row}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 950 }}>{getCustomer(order)}</p>
                        <p style={{ ...styles.muted, margin: "6px 0 0" }}>
                          {getRestaurant(order)} — {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <span style={{ ...styles.badge, ...statusStyle(order.status) }}>
                        {normalizeStatus(order.status)}
                      </span>

                      <p style={{ margin: 0, color: "#FFB56B", fontWeight: 950 }}>
                        {getTotal(order).toLocaleString()} د.ع
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <aside style={styles.section}>
              <h2 style={styles.sectionTitle}>أرقام سريعة</h2>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <div style={styles.compactCard}>
                  <p style={styles.statLabel}>متوسط الطلب</p>
                  <p style={{ ...styles.statValue, color: "#FFB56B" }}>
                    {averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p style={styles.muted}>دينار عراقي</p>
                </div>

                <div style={styles.compactCard}>
                  <p style={styles.statLabel}>طلبات مكتملة</p>
                  <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{deliveredOrders.length}</p>
                  <p style={styles.muted}>تم التسليم</p>
                </div>

                <div style={styles.compactCard}>
                  <p style={styles.statLabel}>تقييمات محفوظة</p>
                  <p style={{ ...styles.statValue, color: "#86EFAC" }}>{ratingsForRole.length}</p>
                  <p style={styles.muted}>من الزبائن</p>
                </div>
              </div>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
