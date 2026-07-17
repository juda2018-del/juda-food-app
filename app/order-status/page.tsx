"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

type OrderItem = {
  name?: string;
  title?: string;
  qty?: number;
  quantity?: number;
  price?: number;
};

type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerName?: string;
  customer?: string;
  name?: string;
  phone?: string;
  customerPhone?: string;
  address?: string;
  restaurant?: string;
  restaurantName?: string;
  total?: number;
  amount?: number;
  subtotal?: number;
  deliveryFee?: number;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  createdAt?: unknown;
  items?: OrderItem[];
};

function toDate(value: unknown): Date | null {
  try {
    if (!value) return null;

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

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function cleanSearch(value: string) {
  return normalizeDigits(value).replace(/\s+/g, "").trim().toLowerCase();
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getDriverName(order: OrderDoc) {
  const assigned = (order.assignedDriverName || "").trim();
  const direct = (order.driverName || "").trim();
  const phone = (order.assignedDriverPhone || order.driverPhone || "").trim();

  if (assigned) return assigned;
  if (direct && direct !== "FUSE إدارة" && direct !== "إدارة FUSE") return direct;
  if (phone === "07800000000") return "kkkkkk";

  return "غير محدد";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function statusIndex(status?: string) {
  const clean = normalizeStatus(status);
  const steps = ["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];
  const index = steps.indexOf(clean);
  return index === -1 ? 0 : index;
}

function statusColor(status?: string) {
  const clean = normalizeStatus(status);

  if (clean === "تم التسليم") return "#86EFAC";
  if (clean === "قيد التوصيل") return "#D8B4FE";
  if (clean === "جاهز للتوصيل") return "#7DD3FC";
  if (clean === "قيد التحضير") return "#FDE68A";
  if (clean === "مرفوض") return "#FCA5A5";

  return "#FFB56B";
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
    maxWidth: 1120,
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
  nav: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
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
  activePill: {
    border: "1px solid rgba(255,122,0,0.35)",
    borderRadius: 999,
    background: "#FF7A00",
    padding: "11px 16px",
    color: "#000",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 950,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.12))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 0.36fr)",
    gap: 14,
    alignItems: "stretch",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20,
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(38px, 6vw, 68px)",
    lineHeight: 1.06,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  muted: {
    color: "rgba(255,255,255,0.60)",
    lineHeight: 1.85,
    fontSize: 14,
  },
  statusLive: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  searchBox: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
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
  layout: {
    display: "grid",
    gap: 14,
  },
  orderCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background:
      "linear-gradient(135deg, rgba(255,122,0,0.09), rgba(255,255,255,0.035))",
    padding: 20,
  },
  orderTop: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 0.4fr) minmax(0, 1fr)",
    gap: 12,
    alignItems: "stretch",
  },
  totalBox: {
    border: "1px solid rgba(255,122,0,0.30)",
    borderRadius: 24,
    background: "rgba(255,122,0,0.10)",
    padding: 18,
  },
  total: {
    margin: "8px 0 0",
    color: "#FF7A00",
    fontSize: 34,
    fontWeight: 950,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 10,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
  },
  label: {
    margin: 0,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 850,
  },
  value: {
    margin: "8px 0 0",
    color: "white",
    fontSize: 16,
    fontWeight: 950,
  },
  progress: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 18,
  },
  step: {
    minHeight: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.13)",
  },
  stepActive: {
    minHeight: 8,
    borderRadius: 999,
    background: "#FF7A00",
  },
  stepLabels: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 8,
  },
  stepText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: 850,
  },
  details: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.26)",
    padding: 16,
    marginTop: 16,
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 0",
    color: "rgba(255,255,255,0.76)",
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 24,
    background: "rgba(255,255,255,0.035)",
    padding: 26,
    textAlign: "center",
  },
};

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [search, setSearch] = useState("");
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromPhone = params.get("phone") || "";
    const fromOrder = params.get("orderId") || params.get("order") || "";
    const value = fromPhone || fromOrder;

    if (value) setSearch(value);

    setLoadedFromUrl(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "orders")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        }));

        data.sort((a, b) => {
          const ad = toDate(a.createdAt)?.getTime() || 0;
          const bd = toDate(b.createdAt)?.getTime() || 0;
          return bd - ad;
        });

        setOrders(data);
      },
      () => setOrders([])
    );

    return () => unsubscribe();
  }, []);

  const matches = useMemo(() => {
    const clean = cleanSearch(search);

    if (!clean) return [];

    return orders.filter((order) => {
      const phone = cleanSearch(getPhone(order));
      const orderId = cleanSearch(order.orderId || "");
      const customer = cleanSearch(getCustomer(order));

      return phone.includes(clean) || clean.includes(phone) || orderId.includes(clean) || customer.includes(clean);
    });
  }, [orders, search]);

  const current = matches[0] || null;
  const currentIndex = statusIndex(current?.status);
  const steps = ["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <Link href="/live-orders" style={styles.pill}>
            الطلبات المباشرة
          </Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>حالة الطلب</p>
              <h1 style={styles.title}>
                تابع طلبك
                <br />
                <span style={styles.orange}>لحظة بلحظة</span>
              </h1>
              <p style={styles.muted}>
                اكتب رقم الهاتف أو رقم الطلب. إذا دخلت من رابط فيه رقم الهاتف راح يظهر طلبك تلقائياً.
              </p>
            </div>

            <div style={styles.card}>
              <p style={styles.eyebrow}>الحالة</p>
              <p style={{ ...styles.statusLive, color: current ? statusColor(current.status) : "#86EFAC" }}>
                {current ? normalizeStatus(current.status) : "مباشر"}
              </p>
              <p style={styles.muted}>
                {current ? `طلب ${getCustomer(current)} من ${getRestaurant(current)}` : "متصل بقاعدة الطلبات"}
              </p>
            </div>
          </div>
        </section>

        <section style={styles.searchBox}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={styles.label}>رقم الهاتف أو رقم الطلب</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.input}
              placeholder="0770... أو FUSE-751080"
              dir="ltr"
            />
          </label>
        </section>

        <section style={styles.layout}>
          {!loadedFromUrl ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>جاري تحميل الحالة...</h2>
            </div>
          ) : !search.trim() ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>اكتب رقم الهاتف</h2>
              <p style={styles.muted}>راح تظهر حالة الطلب هنا مباشرة.</p>
            </div>
          ) : !current ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>ما لقينا طلب مطابق</h2>
              <p style={styles.muted}>تأكد من رقم الهاتف أو استخدم نفس رقم الطلب الموجود برسالة التأكيد.</p>
            </div>
          ) : (
            <article style={styles.orderCard}>
              <div style={styles.orderTop}>
                <div style={styles.totalBox}>
                  <p style={styles.label}>المجموع</p>
                  <p style={styles.total}>{getTotal(current).toLocaleString()} د.ع</p>
                  <p style={styles.muted}>رقم الطلب: {current.orderId || current.documentId}</p>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.miniBox}>
                    <p style={styles.label}>الزبون</p>
                    <p style={styles.value}>{getCustomer(current)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.label}>المطعم</p>
                    <p style={styles.value}>{getRestaurant(current)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.label}>الهاتف</p>
                    <p style={{ ...styles.value, direction: "ltr" }}>{getPhone(current)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.label}>العنوان</p>
                    <p style={styles.value}>{current.address || "غير محدد"}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.label}>السائق</p>
                    <p style={styles.value}>{getDriverName(current)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.label}>الوقت</p>
                    <p style={styles.value}>{formatDate(current.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div style={styles.progress}>
                {steps.map((step, index) => (
                  <div
                    key={step}
                    style={index <= currentIndex ? styles.stepActive : styles.step}
                  />
                ))}
              </div>

              <div style={styles.stepLabels}>
                {steps.map((step) => (
                  <div key={step} style={styles.stepText}>
                    {step}
                  </div>
                ))}
              </div>

              <div style={styles.details}>
                <p style={styles.eyebrow}>تفاصيل الطلب</p>

                {current.items?.length ? (
                  current.items.map((item, index) => (
                    <div key={`${item.name || item.title}-${index}`} style={styles.itemRow}>
                      <span>{item.name || item.title || "صنف"}</span>
                      <strong>
                        {item.qty || item.quantity || 1}x — {Number(item.price || 0).toLocaleString()} د.ع
                      </strong>
                    </div>
                  ))
                ) : (
                  <p style={styles.muted}>ماكو تفاصيل أصناف محفوظة.</p>
                )}
              </div>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
