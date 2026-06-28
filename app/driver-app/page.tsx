"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore";
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
  status?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  createdAt?: unknown;
  items?: OrderItem[];
};

const CURRENT_DRIVER_NAME = "kkkkkk";
const CURRENT_DRIVER_PHONE = "07800000000";

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

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

function getDriverName(order: OrderDoc) {
  return order.assignedDriverName || order.driverName || "غير محدد";
}

function getDriverPhone(order: OrderDoc) {
  return order.assignedDriverPhone || order.driverPhone || "";
}

function isMyOrder(order: OrderDoc) {
  const driverName = getDriverName(order).trim();
  const driverPhone = getDriverPhone(order).trim();

  return driverName === CURRENT_DRIVER_NAME || driverPhone === CURRENT_DRIVER_PHONE;
}

function isOpenDriverOrder(order: OrderDoc) {
  const status = normalizeStatus(order.status);

  return (
    isMyOrder(order) &&
    status !== "تم التسليم" &&
    status !== "مرفوض" &&
    status !== "ملغي"
  );
}

function statusColor(status?: string) {
  const clean = normalizeStatus(status);

  if (clean === "قيد التوصيل") return "#D8B4FE";
  if (clean === "جاهز للتوصيل") return "#7DD3FC";
  if (clean === "قيد التحضير") return "#FDE68A";
  if (clean === "تم التسليم") return "#86EFAC";

  return "#FFB56B";
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%), #050505",
    color: "white",
    padding: "26px 16px",
    fontFamily: "Arial, sans-serif",
  },
  shell: { width: "100%", maxWidth: 1180, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  nav: { display: "flex", gap: 10, flexWrap: "wrap" },
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
  logout: {
    border: "1px solid rgba(239,68,68,0.45)",
    borderRadius: 999,
    background: "rgba(239,68,68,0.10)",
    padding: "11px 16px",
    color: "#FCA5A5",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background: "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.12))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) repeat(4, minmax(130px, 0.22fr))",
    gap: 12,
    alignItems: "stretch",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20,
  },
  statCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    background: "rgba(0,0,0,0.34)",
    padding: 16,
    minHeight: 118,
  },
  eyebrow: { margin: 0, color: "#FF7A00", fontSize: 13, fontWeight: 950 },
  title: { margin: "8px 0 0", fontSize: "clamp(38px, 6vw, 64px)", lineHeight: 1.06, fontWeight: 950 },
  orange: { color: "#FF7A00" },
  muted: { color: "rgba(255,255,255,0.60)", lineHeight: 1.85, fontSize: 14 },
  statLabel: { margin: 0, color: "rgba(255,255,255,0.54)", fontSize: 13, fontWeight: 850 },
  statValue: { margin: "9px 0 0", fontSize: 30, fontWeight: 950 },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.38fr)",
    gap: 14,
    alignItems: "start",
  },
  section: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  sectionTitle: { margin: 0, fontSize: 28, fontWeight: 950 },
  driverBox: {
    border: "1px solid rgba(255,122,0,0.32)",
    borderRadius: 28,
    background: "rgba(255,122,0,0.08)",
    padding: 18,
  },
  badge: {
    display: "inline-flex",
    border: "1px solid rgba(34,197,94,0.42)",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  badBadge: {
    display: "inline-flex",
    border: "1px solid rgba(239,68,68,0.42)",
    borderRadius: 999,
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  orderCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "linear-gradient(135deg, rgba(255,122,0,0.09), rgba(255,255,255,0.035))",
    padding: 18,
    marginTop: 14,
  },
  orderTop: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 0.28fr) minmax(0, 1fr)",
    gap: 12,
    alignItems: "stretch",
  },
  totalBox: {
    border: "1px solid rgba(255,122,0,0.30)",
    borderRadius: 22,
    background: "rgba(255,122,0,0.10)",
    padding: 16,
  },
  total: { margin: "8px 0 0", color: "#FF7A00", fontSize: 34, fontWeight: 950 },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
  },
  label: { margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 850 },
  value: { margin: "8px 0 0", color: "white", fontSize: 16, fontWeight: 950 },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 14,
  },
  mainButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "15px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
  },
  secondaryButton: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    color: "white",
    padding: "15px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
  },
  disabledButton: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.38)",
    padding: "15px 16px",
    fontSize: 14,
    fontWeight: 950,
  },
  details: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.26)",
    padding: 16,
    marginTop: 14,
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
    marginTop: 14,
  },
  messageOk: {
    border: "1px solid rgba(34,197,94,0.30)",
    borderRadius: 18,
    background: "rgba(34,197,94,0.10)",
    color: "#86EFAC",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900,
  },
};

export default function DriverAppPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");

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

  const myOrders = useMemo(() => orders.filter(isOpenDriverOrder), [orders]);
  const delivering = myOrders.filter((order) => normalizeStatus(order.status) === "قيد التوصيل").length;
  const ready = myOrders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل").length;
  const totalMoney = myOrders.reduce((sum, order) => sum + getTotal(order), 0);

  async function updateOrder(order: OrderDoc, status: string) {
    setMessage("");

    await updateDoc(doc(db, "orders", order.documentId), {
      status,
      driverName: CURRENT_DRIVER_NAME,
      driverPhone: CURRENT_DRIVER_PHONE,
      assignedDriverName: CURRENT_DRIVER_NAME,assignedDriverPhone: CURRENT_DRIVER_PHONE,
      updatedAt: serverTimestamp(),
      ...(status === "تم التسليم" ? { deliveredAt: serverTimestamp() } : {}),
    });

    setMessage(`تم تحديث طلب ${getCustomer(order)} إلى ${status}.`);
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <nav style={styles.nav}>
            <Link href="/" style={styles.pill}>الرئيسية</Link>
            <Link href="/live-orders" style={styles.pill}>الطلبات المباشرة</Link>
            <Link href="/drivers-admin" style={styles.pill}>إدارة السائقين</Link>
            <Link href="/auto-dispatch" style={styles.pill}>التوزيع التلقائي</Link>
          </nav>

          <Link href="/login" style={styles.logout}>خروج</Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>تطبيق السائق</p>
              <h1 style={styles.title}>
                طلباتك
                <br />
                <span style={styles.orange}>فقط المرتبطة بيك</span>
              </h1>
              <p style={styles.muted}>
                هاي الصفحة تعرض طلبات السائق الحالي فقط، وتخفي الطلبات القديمة أو المسلّمة.
              </p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>حالتي</p>
              <p style={{ ...styles.statValue, color: online ? "#86EFAC" : "#FCA5A5" }}>
                {online ? "متصل" : "غير متصل"}
              </p>
              <p style={styles.muted}>محفوظ محلياً</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>طلباتي</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{myOrders.length}</p>
              <p style={styles.muted}>غير مسلّمة</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>قيد التوصيل</p>
              <p style={{ ...styles.statValue, color: "#D8B4FE" }}>{delivering}</p>
              <p style={styles.muted}>نشطة</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>المبالغ</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{totalMoney.toLocaleString()}</p>
              <p style={styles.muted}>د.ع</p>
            </div>
          </div>
        </section>

        <section style={styles.layout}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>طلباتي الحالية</h2>

            {message ? <div style={styles.messageOk}>{message}</div> : null}

            {myOrders.length === 0 ? (
              <div style={styles.empty}>
                <h3 style={{ margin: 0 }}>ماكو طلبات مرتبطة بيك حالياً</h3>
                <p style={styles.muted}>من Auto Dispatch اربط طلب بالسائق kkkkkk حتى يظهر هنا.</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <article key={order.documentId} style={styles.orderCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    <div>
                      <span style={{ ...styles.badge, color: statusColor(order.status) }}>
                        {normalizeStatus(order.status)}
                      </span>
                      <h3 style={{ margin: "10px 0 0", fontSize: 26, fontWeight: 950 }}>
                        {getCustomer(order)}
                      </h3>
                      <p style={styles.muted}>{getRestaurant(order)} — {formatDate(order.createdAt)}</p>
                    </div>

                    <div style={styles.totalBox}>
                      <p style={styles.label}>المجموع</p>
                      <p style={styles.total}>{getTotal(order).toLocaleString()} د.ع</p>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.miniBox}>
                      <p style={styles.label}>رقم الطلب</p>
                      <p style={styles.value}>{order.orderId || order.documentId}</p>
                    </div>

                    <div style={styles.miniBox}>
                      <p style={styles.label}>الهاتف</p>
                      <p style={{ ...styles.value, direction: "ltr" }}>{getPhone(order)}</p>
                    </div>

                    <div style={styles.miniBox}>
                      <p style={styles.label}>العنوان</p>
                      <p style={styles.value}>{order.address || "غير محدد"}</p>
                    </div>
                  </div>

                  <div style={styles.details}>
                    <p style={styles.eyebrow}>تفاصيل الطلب</p>

                    {order.items?.length ? (
                      order.items.map((item, index) => (
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

                  <div style={styles.actionGrid}>
                    <button
                      onClick={() => updateOrder(order, "قيد التوصيل")}
                      disabled={normalizeStatus(order.status) === "قيد التوصيل"}
                      style={normalizeStatus(order.status) === "قيد التوصيل" ? styles.disabledButton : styles.secondaryButton}
                    >
                      استلمت الطلب
                    </button>

                    <button onClick={() => updateOrder(order, "تم التسليم")} style={styles.mainButton}>
                      تم التسليم
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside style={styles.section}>
            <h2 style={styles.sectionTitle}>حالة السائق</h2>

            <div style={styles.driverBox}>
              <p style={styles.statLabel}>الحساب</p>
              <h3 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 950 }}>
                {CURRENT_DRIVER_NAME}
              </h3>
              <p style={{ ...styles.muted, direction: "ltr" }}>{CURRENT_DRIVER_PHONE}</p>

              <span style={online ? styles.badge : styles.badBadge}>
                {online ? "متصل" : "غير متصل"}
              </span>

              <button onClick={() => setOnline(true)} style={{ ...styles.mainButton, marginTop: 16 }}>
                تشغيل واستلام طلبات
              </button>

              <button onClick={() => setOnline(false)} style={{ ...styles.secondaryButton, marginTop: 10 }}>
                إيقاف مؤقت
              </button>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
