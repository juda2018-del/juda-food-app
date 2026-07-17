"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
  status?: string;
  total?: number;
  amount?: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: unknown;
  items?: OrderItem[];
};

type DriverDoc = {
  documentId: string;
  name?: string;
  driverName?: string;
  phone?: string;
  driverPhone?: string;
  status?: string;
  online?: boolean;
  available?: boolean;
  rating?: number;
  orders?: number;
  completedOrders?: number;
  area?: string;
};

const fallbackDrivers: DriverDoc[] = [
  {
    documentId: "fallback-driver-1",
    name: "kkkkkk",
    phone: "07800000000",
    status: "متصل",
    online: true,
    available: true,
    rating: 4.8,
    orders: 0,
    area: "زيونة",
  },
];

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
  if (status === "ready") return "جاهز للتوصيل";
  if (status === "ready_for_delivery") return "جاهز للتوصيل";
  return status;
}

function isDeliveredOrClosed(order: OrderDoc) {
  const status = normalizeStatus(order.status);
  return status === "تم التسليم" || status === "مرفوض" || status === "ملغي";
}

function isAssigned(order: OrderDoc) {
  const driverName = (order.driverName || "").trim();
  const driverId = (order.driverId || "").trim();

  return Boolean(driverId) || (Boolean(driverName) && driverName !== "غير محدد");
}

function canDispatch(order: OrderDoc) {
  if (isDeliveredOrClosed(order)) return false;
  if (isAssigned(order)) return false;

  const status = normalizeStatus(order.status);

  return (
    status === "جاهز للتوصيل" ||
    status === "جاهز" ||
    status === "جديد" ||
    status === "قيد التحضير"
  );
}

function driverName(driver: DriverDoc) {
  return driver.name || driver.driverName || "سائق";
}

function driverPhone(driver: DriverDoc) {
  return driver.phone || driver.driverPhone || "";
}

function isDriverOnline(driver: DriverDoc) {
  if (driver.online === true) return true;
  if (driver.available === true) return true;
  return driver.status === "متصل" || driver.status === "online";
}

function driverScore(driver: DriverDoc) {
  const rating = Number(driver.rating || 4.5);
  const completed = Number(driver.completedOrders || driver.orders || 0);
  const onlineBoost = isDriverOnline(driver) ? 35 : 0;

  return Math.round(rating * 10 + completed + onlineBoost);
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
    maxWidth: 1220,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
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
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(38px, 6vw, 64px)",
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
  statLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.54)",
    fontSize: 13,
    fontWeight: 850,
  },
  statValue: {
    margin: "9px 0 0",
    fontSize: 30,
    fontWeight: 950,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(330px, 0.42fr)",
    gap: 14,
    alignItems: "start",
  },
  section: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14,
    marginTop: 14,
  },
  orderBox: {
    border: "1px solid rgba(255,122,0,0.24)",
    borderRadius: 24,
    background: "rgba(255,122,0,0.08)",
    padding: 16,
    marginTop: 14,
  },
  driverCard: {
    border: "1px solid rgba(255,122,0,0.38)",
    borderRadius: 26,
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.38), rgba(255,122,0,0.08))",
    padding: 16,
  },
  driverGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    padding: 12,
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
  offlineBadge: {
    display: "inline-flex",
    border: "1px solid rgba(239,68,68,0.42)",
    borderRadius: 999,
    background: "rgba(239,68,68,0.12)",
    color: "#FCA5A5",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
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
    marginTop: 14,
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

export default function AutoDispatchPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribeOrders = onSnapshot(
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

    const unsubscribeDrivers = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<DriverDoc, "documentId">),
          documentId: item.id,
        }));

        setDrivers(data);
      },
      () => setDrivers([])
    );

    return () => {
      unsubscribeOrders();
      unsubscribeDrivers();
    };
  }, []);

  const dispatchOrders = useMemo(() => orders.filter((order) => !isDeliveredOrClosed(order)), [orders]);
  const activeDrivers = useMemo(() => {
    const source = drivers.length ? drivers : fallbackDrivers;
    return source.sort((a, b) => driverScore(b) - driverScore(a));
  }, [drivers]);

  const selectedOrder = useMemo(() => {
    return dispatchOrders.find((order) => order.documentId === selectedOrderId) || dispatchOrders[0] || null;
  }, [dispatchOrders, selectedOrderId]);

  const bestDriver = activeDrivers[0] || null;
  const selectedDriver =
    activeDrivers.find((driver) => driver.documentId === selectedDriverId) || bestDriver;

  useEffect(() => {
    if (!selectedOrderId && dispatchOrders[0]) {
      setSelectedOrderId(dispatchOrders[0].documentId);
    }
  }, [dispatchOrders, selectedOrderId]);

  useEffect(() => {
    if (!selectedDriverId && activeDrivers[0]) {
      setSelectedDriverId(activeDrivers[0].documentId);
    }
  }, [activeDrivers, selectedDriverId]);

  async function assignOrder(driver: DriverDoc | null) {
    setMessage("");

    if (!selectedOrder) {
      setMessage("ماكو طلب جاهز للتوزيع.");
      return;
    }

    if (!driver) {
      setMessage("ماكو سائق متاح.");
      return;
    }

    setSaving(true);

    try {
      const dName = driverName(driver);
      const dPhone = driverPhone(driver);

      await updateDoc(doc(db, "orders", selectedOrder.documentId), {
        status: "قيد التوصيل",
        driverId: driver.documentId,
        driverName: dName,
        driverPhone: dPhone,
        assignedDriverName: dName,assignedDriverPhone: dPhone,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        type: "dispatch",
        title: "تم ربط الطلب بسائق",
        message: `تم ربط طلب ${getCustomer(selectedOrder)} مع السائق ${dName}.`,
        orderId: selectedOrder.orderId || selectedOrder.documentId,
        restaurant: getRestaurant(selectedOrder),
        driverName: dName,
        driverPhone: dPhone,
        read: false,
        createdAt: serverTimestamp(),
      });

      setMessage(`تم ربط طلب ${getCustomer(selectedOrder)} مع السائق ${dName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر ربط الطلب بالسائق.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <nav style={styles.nav}>
            <Link href="/" style={styles.pill}>
              الرئيسية
            </Link>
            <Link href="/driver-app" style={styles.pill}>
              تطبيق السائق
            </Link>
            <Link href="/drivers-admin" style={styles.pill}>
              إدارة السائقين
            </Link>
            <Link href="/restaurant-admin" style={styles.pill}>
              لوحة المطعم
            </Link>
            <Link href="/live-orders" style={styles.pill}>
              الطلبات المباشرة
            </Link>
          </nav>

          <Link href="/fuse-admin" style={styles.activePill}>
            لوحة الإدارة
          </Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>التوزيع التلقائي</p>
              <h1 style={styles.title}>
                فيوز يختار
                <br />
                <span style={styles.orange}>أفضل سائق</span>
              </h1>
              <p style={styles.muted}>
                يعرض كل الطلبات النشطة، حتى سمير والطلبات المربوطة سابقاً، وتكدر تربطها أو تعيد ربطها بالسائق.
              </p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>طلبات تحتاج سائق</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{dispatchOrders.length}</p>
              <p style={styles.muted}>نشطة</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>سائقين</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{activeDrivers.length}</p>
              <p style={styles.muted}>متاحين بالنظام</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>نشطة</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>
                {orders.filter((order) => !isDeliveredOrClosed(order)).length}
              </p>
              <p style={styles.muted}>داخل التشغيل</p>
            </div>

            <div style={styles.statCard}>
              <p style={styles.statLabel}>الأفضل</p>
              <p style={{ ...styles.statValue, color: "#D8B4FE" }}>
                {bestDriver ? driverScore(bestDriver) : "--"}
              </p>
              <p style={styles.muted}>Score</p>
            </div>
          </div>
        </section>

        <section style={styles.layout}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>السائقين المتصلين</h2>

            {activeDrivers.map((driver) => (
              <article key={driver.documentId} style={{ ...styles.driverCard, marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 950 }}>
                      {driverName(driver)}
                    </h3>
                    <p style={{ ...styles.muted, margin: "8px 0 0", direction: "ltr" }}>
                      {driverPhone(driver) || "بدون رقم"}
                    </p>
                  </div>

                  <span style={isDriverOnline(driver) ? styles.badge : styles.offlineBadge}>
                    {isDriverOnline(driver) ? "متصل" : "غير متصل"}
                  </span>
                </div>

                <div style={styles.driverGrid}>
                  <div style={styles.miniBox}>
                    <p style={styles.statLabel}>Score</p>
                    <p style={styles.statValue}>{driverScore(driver)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.statLabel}>طلبات</p>
                    <p style={styles.statValue}>{Number(driver.orders || driver.completedOrders || 0)}</p>
                  </div>

                  <div style={styles.miniBox}>
                    <p style={styles.statLabel}>تقييم</p>
                    <p style={styles.statValue}>{Number(driver.rating || 4.5).toFixed(1)}</p>
                  </div>
                </div>

                <button
                  onClick={() => assignOrder(driver)}
                  disabled={saving || !selectedOrder}
                  style={saving || !selectedOrder ? styles.disabledButton : styles.mainButton}
                >
                  ربط هذا السائق
                </button>
              </article>
            ))}
          </section>

          <aside style={styles.section}>
            <h2 style={styles.sectionTitle}>الطلب المراد توزيعه</h2>

            <select
              value={selectedOrder?.documentId || ""}
              onChange={(event) => setSelectedOrderId(event.target.value)}
              style={styles.select}
            >
              {dispatchOrders.length === 0 ? (
                <option value="">لا توجد طلبات تحتاج سائق</option>
              ) : (
                dispatchOrders.map((order) => (
                  <option key={order.documentId} value={order.documentId}>
                    {getCustomer(order)} — {getRestaurant(order)} — {getTotal(order).toLocaleString()} د.ع — {order.orderId || order.documentId}
                  </option>
                ))
              )}
            </select>

            {selectedOrder ? (
              <div style={styles.orderBox}>
                <p style={styles.statLabel}>الطلب المختار</p>
                <h3 style={{ margin: "10px 0 0", fontSize: 26, fontWeight: 950 }}>
                  {getCustomer(selectedOrder)}
                </h3>

                <p style={styles.muted}>
                  {getRestaurant(selectedOrder)} — {formatDate(selectedOrder.createdAt)}
                </p>

                <p style={{ ...styles.muted, direction: "ltr" }}>
                  {getPhone(selectedOrder)}
                </p>

                <p style={{ margin: "12px 0 0", color: "#FFB56B", fontSize: 24, fontWeight: 950 }}>
                  {getTotal(selectedOrder).toLocaleString()} د.ع
                </p>

                <p style={styles.muted}>
                  الحالة الحالية: {normalizeStatus(selectedOrder.status)}
                </p>
              </div>
            ) : (
              <div style={styles.orderBox}>
                <h3 style={{ margin: 0 }}>ماكو طلب جاهز للتوزيع</h3>
                <p style={styles.muted}>
                  حول الطلب من لوحة المطعم إلى جاهز للتوصيل حتى يظهر هنا.
                </p>
              </div>
            )}

            <select
              value={selectedDriver?.documentId || ""}
              onChange={(event) => setSelectedDriverId(event.target.value)}
              style={styles.select}
            >
              {activeDrivers.map((driver) => (
                <option key={driver.documentId} value={driver.documentId}>
                  {driverName(driver)} — Score {driverScore(driver)}
                </option>
              ))}
            </select>

            <button
              onClick={() => assignOrder(selectedDriver || bestDriver)}
              disabled={saving || !selectedOrder || !selectedDriver}
              style={saving || !selectedOrder || !selectedDriver ? styles.disabledButton : styles.mainButton}
            >
              {saving ? "جاري الربط..." : "توزيع تلقائي على الأفضل"}
            </button>

            {message ? <div style={styles.messageOk}>{message}</div> : null}
          </aside>
        </section>
      </section>
    </main>
  );
}
