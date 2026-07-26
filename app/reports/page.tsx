"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
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
  restaurantId?: string;
  total?: number;
  amount?: number;
  status?: string;
  driverName?: string;
  createdAt?: unknown;
};

type RatingDoc = {
  documentId: string;
  restaurant?: string;
  restaurantName?: string;
  restaurantId?: string;
  restaurantRating?: number;
  driverRating?: number;
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION) || localStorage.getItem("FUSE_LOCAL_SESSION");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role || parsed.fuseRole);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function restaurantKey(session: FuseSession | null) {
  return String(session?.restaurantId || session?.restaurant || session?.restaurantName || "").trim();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    if (typeof value === "object" && value !== null && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") return (value as { toDate: () => Date }).toDate();
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
  return order.restaurantName || order.restaurant || "مطعم";
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

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function statusStyle(status?: string): CSSProperties {
  const clean = normalizeStatus(status);
  if (clean === "جديد") return { color: "#FFB56B", borderColor: "rgba(255,122,0,.45)" };
  if (clean === "قيد التحضير") return { color: "#FDE68A", borderColor: "rgba(234,179,8,.45)" };
  if (clean === "جاهز للتوصيل") return { color: "#7DD3FC", borderColor: "rgba(14,165,233,.45)" };
  if (clean === "قيد التوصيل") return { color: "#D8B4FE", borderColor: "rgba(168,85,247,.45)" };
  if (clean === "تم التسليم") return { color: "#86EFAC", borderColor: "rgba(34,197,94,.45)" };
  if (clean === "مرفوض" || clean === "ملغي") return { color: "#FCA5A5", borderColor: "rgba(239,68,68,.45)" };
  return { color: "rgba(255,255,255,.7)", borderColor: "rgba(255,255,255,.2)" };
}

export default function ReportsPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [ratings, setRatings] = useState<RatingDoc[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/reports";
      return;
    }
    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    if (saved.role === "restaurant" && !restaurantKey(saved)) {
      setError("حساب المطعم غير مربوط بمطعم. راجع إدارة FUSE لربط الحساب.");
      setLoading(false);
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session || error) return;

    const key = restaurantKey(session);
    const ordersQuery = session.role === "admin"
      ? query(collection(db, "orders"), orderBy("createdAt", "desc"))
      : query(collection(db, "orders"), where("restaurantId", "==", key), orderBy("createdAt", "desc"));

    const ratingsQuery = session.role === "admin"
      ? query(collection(db, "ratings"), orderBy("createdAt", "desc"))
      : query(collection(db, "ratings"), where("restaurantId", "==", key), orderBy("createdAt", "desc"));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        })));
        setLoading(false);
      },
      (cause) => {
        console.error(cause);
        setOrders([]);
        setError("تعذر تحميل تقارير الطلبات أو يحتاج الاستعلام إلى فهرس Firestore.");
        setLoading(false);
      }
    );

    const unsubRatings = onSnapshot(
      ratingsQuery,
      (snapshot) => setRatings(snapshot.docs.map((item) => ({
        ...(item.data() as Omit<RatingDoc, "documentId">),
        documentId: item.id,
      }))),
      () => setRatings([])
    );

    return () => {
      unsubOrders();
      unsubRatings();
    };
  }, [session, error]);

  const visibleOrders = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders
      .filter((order) => statusFilter === "الكل" || normalizeStatus(order.status) === statusFilter)
      .filter((order) => {
        if (!needle) return true;
        return [getCustomer(order), getPhone(order), getRestaurant(order), order.driverName || "", order.documentId]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [orders, search, statusFilter]);

  const delivered = visibleOrders.filter((order) => normalizeStatus(order.status) === "تم التسليم");
  const active = visibleOrders.filter((order) => !["تم التسليم", "مرفوض", "ملغي"].includes(normalizeStatus(order.status)));
  const revenue = delivered.reduce((sum, order) => sum + getTotal(order), 0);
  const averageOrder = delivered.length ? revenue / delivered.length : 0;
  const restaurantRating = average(ratings.map((item) => Number(item.restaurantRating || 0)));
  const driverRating = average(ratings.map((item) => Number(item.driverRating || 0)));

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.pill}>الرئيسية</Link>
          <Link href={session?.role ? roleHome[session.role] : "/login"} style={styles.pill}>لوحتي</Link>
        </div>

        <header style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>تقارير FUSE</p>
            <h1 style={styles.title}>الأداء والمبيعات</h1>
            <p style={styles.muted}>البيانات المعروضة محددة حسب حسابك وصلاحيتك فقط.</p>
          </div>
          <div style={styles.stats}>
            <Stat label="الدور" value={session?.role ? roleTitle[session.role] : "—"} />
            <Stat label="المبيعات" value={`${revenue.toLocaleString("en-US")} د.ع`} />
            <Stat label="الطلبات" value={String(visibleOrders.length)} note={`نشطة: ${active.length}`} />
            <Stat label="التقييم" value={restaurantRating.toFixed(1)} note={`السائق: ${driverRating.toFixed(1)}`} />
          </div>
        </header>

        {error ? (
          <section style={styles.errorBox}>
            <h2 style={{ marginTop: 0 }}>تعذر فتح التقرير</h2>
            <p style={styles.muted}>{error}</p>
          </section>
        ) : (
          <>
            <section style={styles.filters}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="زبون، هاتف، مطعم أو سائق" style={styles.input} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.input}>
                {["الكل", "جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم", "مرفوض", "ملغي"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </section>

            {loading ? (
              <section style={styles.empty}>جاري تحميل التقرير...</section>
            ) : (
              <section style={styles.contentGrid}>
                <div style={styles.panel}>
                  <h2 style={{ marginTop: 0 }}>آخر الطلبات</h2>
                  <div style={styles.list}>
                    {visibleOrders.slice(0, 12).map((order) => (
                      <article key={order.documentId} style={styles.orderRow}>
                        <div>
                          <strong>{getCustomer(order)}</strong>
                          <p style={styles.muted}>{getRestaurant(order)} — {formatDate(order.createdAt)}</p>
                        </div>
                        <span style={{ ...styles.badge, ...statusStyle(order.status) }}>{normalizeStatus(order.status)}</span>
                        <strong style={{ color: "#FFB56B" }}>{getTotal(order).toLocaleString("en-US")} د.ع</strong>
                      </article>
                    ))}
                    {!visibleOrders.length && <div style={styles.empty}>ماكو طلبات مطابقة.</div>}
                  </div>
                </div>

                <aside style={styles.panel}>
                  <h2 style={{ marginTop: 0 }}>أرقام سريعة</h2>
                  <Stat label="متوسط الطلب" value={`${averageOrder.toLocaleString("en-US", { maximumFractionDigits: 0 })} د.ع`} />
                  <Stat label="طلبات مكتملة" value={String(delivered.length)} />
                  <Stat label="تقييمات محفوظة" value={String(ratings.length)} />
                </aside>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      {note && <p style={styles.muted}>{note}</p>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top right, rgba(255,122,0,.16), transparent 34%), #050505", color: "white", padding: "24px 14px", fontFamily: "Cairo, Arial, sans-serif" },
  shell: { maxWidth: 1200, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  pill: { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "10px 16px", background: "rgba(255,255,255,.05)", fontWeight: 900 },
  hero: { border: "1px solid rgba(255,255,255,.11)", borderRadius: 30, padding: 22, background: "linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,122,0,.10))", marginBottom: 16 },
  eyebrow: { color: "#FF7A00", fontWeight: 950, margin: 0 },
  title: { fontSize: "clamp(36px,6vw,64px)", margin: "8px 0", fontWeight: 950 },
  muted: { color: "rgba(255,255,255,.62)", lineHeight: 1.7, margin: "6px 0 0" },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 18 },
  statCard: { border: "1px solid rgba(255,255,255,.10)", borderRadius: 22, padding: 16, background: "rgba(0,0,0,.30)" },
  statLabel: { margin: 0, color: "rgba(255,255,255,.55)", fontSize: 13, fontWeight: 900 },
  statValue: { margin: "8px 0 0", fontSize: 28, fontWeight: 950, color: "#FFB56B" },
  filters: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(180px,.35fr)", gap: 12, marginBottom: 16 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, background: "#090909", color: "white", padding: "14px 15px", fontSize: 15 },
  contentGrid: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(260px,.35fr)", gap: 14 },
  panel: { border: "1px solid rgba(255,255,255,.10)", borderRadius: 26, padding: 18, background: "rgba(255,255,255,.045)" },
  list: { display: "grid", gap: 10 },
  orderRow: { display: "grid", gridTemplateColumns: "minmax(0,1fr) 130px 140px", alignItems: "center", gap: 10, border: "1px solid rgba(255,255,255,.09)", borderRadius: 18, padding: 13, background: "rgba(0,0,0,.25)" },
  badge: { display: "inline-flex", justifyContent: "center", border: "1px solid", borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 950 },
  empty: { border: "1px dashed rgba(255,255,255,.16)", borderRadius: 22, padding: 24, textAlign: "center", color: "rgba(255,255,255,.65)" },
  errorBox: { border: "1px solid rgba(239,68,68,.35)", background: "rgba(239,68,68,.08)", borderRadius: 24, padding: 22 },
};