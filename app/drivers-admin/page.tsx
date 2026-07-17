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
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  roleTitle,
  type FuseSession,
} from "@/lib/fuse-auth";

type DriverDoc = {
  documentId: string;
  name?: string;
  driverName?: string;
  phone?: string;
  driverPhone?: string;
  email?: string;
  status?: string;
  online?: boolean;
  isOnline?: boolean;
  rating?: number;
  currentOrders?: number;
  activeOrders?: number;
  earnings?: number;
  area?: string;
  lastSeen?: unknown;
};

type OrderDoc = {
  documentId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  total?: number;
  amount?: number;
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

function cleanPhone(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function getDriverName(driver: DriverDoc) {
  return driver.name || driver.driverName || "سائق";
}

function getDriverPhone(driver: DriverDoc) {
  return driver.phone || driver.driverPhone || "";
}

function isOnline(driver: DriverDoc) {
  return driver.online === true || driver.isOnline === true || driver.status === "متصل";
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

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

function orderForDriver(order: OrderDoc, driver: DriverDoc) {
  const orderPhone = cleanPhone(order.driverPhone);
  const driverPhone = cleanPhone(getDriverPhone(driver));

  if (order.driverId && order.driverId === driver.documentId) return true;
  if (order.driverName && order.driverName === getDriverName(driver)) return true;
  if (orderPhone && driverPhone && orderPhone.includes(driverPhone)) return true;

  return false;
}

function getOrderTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
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
  tools: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "14px 15px",
    outline: "none",
    fontSize: 14,
  },
  button: {
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "14px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
  },
  disabledButton: {
    border: 0,
    borderRadius: 18,
    background: "rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.35)",
    padding: "14px 16px",
    fontSize: 14,
    fontWeight: 950,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  },
  driverCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  driverTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
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
  badgeOrange: {
    borderColor: "rgba(255,122,0,0.42)",
    background: "rgba(255,122,0,0.12)",
    color: "#FFB56B",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginTop: 14,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(0,0,0,0.26)",
    padding: 10,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginTop: 14,
  },
  onlineButton: {
    border: 0,
    borderRadius: 16,
    background: "#FF7A00",
    color: "#000",
    padding: "13px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
  },
  offlineButton: {
    border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: 16,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: "13px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
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
  messageBad: {
    border: "1px solid rgba(239,68,68,0.30)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.10)",
    color: "#FCA5A5",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900,
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 24,
    background: "rgba(255,255,255,0.035)",
    padding: 24,
    textAlign: "center",
  },
};

export default function DriversAdminPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingDriverId, setSavingDriverId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();

    if (!saved) {
      window.location.href = "/login?next=/drivers-admin";
      return;
    }

    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/live-orders";
      return;
    }

    setSession(saved);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "drivers"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<DriverDoc, "documentId">),
          documentId: item.id,
        }));

        setDrivers(data);
      },
      (snapshotError) => setError(snapshotError.message || "تعذر تحميل السائقين")
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        }));

        setOrders(data);
      },
      () => setOrders([])
    );

    return () => unsubscribe();
  }, []);

  const onlineDrivers = drivers.filter(isOnline);
  const offlineDrivers = drivers.filter((driver) => !isOnline(driver));

  const activeAssignedOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return (order.driverId || order.driverName) && status !== "تم التسليم" && status !== "مرفوض";
  });

  const deliveredOrders = orders.filter((order) => normalizeStatus(order.status) === "تم التسليم");

  async function addDriver() {
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("اكتب اسم السائق.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "drivers"), {
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim() || "بغداد",
        online: false,
        isOnline: false,
        status: "غير متصل",
        rating: 4.8,
        currentOrders: 0,
        activeOrders: 0,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      setMessage("تمت إضافة السائق.");
      setName("");
      setPhone("");
      setArea("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إضافة السائق");
    } finally {
      setSaving(false);
    }
  }

  async function updateDriverStatus(driver: DriverDoc, online: boolean) {
    setSavingDriverId(driver.documentId);
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "drivers", driver.documentId), {
        online,
        isOnline: online,
        status: online ? "متصل" : "غير متصل",
        lastSeen: serverTimestamp(),
      });

      setMessage(online ? "تم تشغيل السائق." : "تم إيقاف السائق.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تحديث السائق");
    } finally {
      setSavingDriverId("");
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <nav style={styles.nav}>
            <Link href="/" style={styles.pill}>الرئيسية</Link>
            <Link href="/driver-app" style={styles.pill}>تطبيق السائق</Link>
            <Link href="/auto-dispatch" style={styles.pill}>التوزيع التلقائي</Link>
            <Link href="/drivers-admin" style={styles.activePill}>إدارة السائقين</Link>
          </nav>

          <Link href={roleHome.admin} style={styles.pill}>لوحتي</Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>إدارة السائقين</p>
              <h1 style={styles.title}>
                الأسطول
                <br />
                <span style={styles.orange}>والحالة المباشرة</span>
              </h1>
              <p style={styles.muted}>
                أضف السائقين، شغّل أو أوقف الحالة، وشوف الطلبات المرتبطة بكل سائق.
              </p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>الدور</p>
              <p style={{ ...styles.statValue, ...styles.orange }}>
                {session ? roleTitle[session.role] : "—"}
              </p>
              <p style={styles.muted}>{session?.name || "غير مسجل"}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>السائقين</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{drivers.length}</p>
              <p style={styles.muted}>متصلين: {onlineDrivers.length}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>طلبات مرتبطة</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{activeAssignedOrders.length}</p>
              <p style={styles.muted}>قيد التشغيل</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>طلبات مكتملة</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{deliveredOrders.length}</p>
              <p style={styles.muted}>تم التسليم</p>
            </div>
          </div>
        </section>

        <section style={styles.tools}>
          <p style={styles.eyebrow}>إضافة سائق</p>

          <div style={{ height: 12 }} />

          <div style={styles.formGrid}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              style={styles.input}
              placeholder="اسم السائق"
            />

            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              style={styles.input}
              placeholder="رقم الهاتف"
              dir="ltr"
            />

            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              style={styles.input}
              placeholder="المنطقة"
            />

            <button onClick={addDriver} disabled={saving} style={saving ? styles.disabledButton : styles.button}>
              {saving ? "جاري الحفظ..." : "إضافة السائق"}
            </button>
          </div>

          {message ? <div style={styles.messageOk}>{message}</div> : null}
          {error ? <div style={styles.messageBad}>{error}</div> : null}
        </section>

        {drivers.length === 0 ? (
          <div style={styles.empty}>
            <h2 style={{ margin: 0 }}>ماكو سائقين حالياً</h2>
            <p style={styles.muted}>أضف أول سائق حتى يظهر بالتوزيع التلقائي.</p>
          </div>
        ) : (
          <section style={styles.grid}>
            {drivers.map((driver) => {
              const driverOrders = orders.filter((order) => orderForDriver(order, driver));
              const activeOrders = driverOrders.filter((order) => {
                const status = normalizeStatus(order.status);
                return status !== "تم التسليم" && status !== "مرفوض";
              });

              const delivered = driverOrders.filter(
                (order) => normalizeStatus(order.status) === "تم التسليم"
              );

              const revenue = delivered.reduce((sum, order) => sum + Math.round(getOrderTotal(order) * 0.12), 0);

              return (
                <article key={driver.documentId} style={styles.driverCard}>
                  <div style={styles.driverTop}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 23, fontWeight: 950 }}>
                        {getDriverName(driver)}
                      </h2>

                      <p style={{ ...styles.muted, direction: "ltr", margin: "8px 0 0" }}>
                        {getDriverPhone(driver) || "بدون هاتف"}
                      </p>

                      <p style={{ ...styles.muted, margin: "8px 0 0" }}>
                        {driver.area || "بغداد"} — آخر ظهور: {formatDate(driver.lastSeen)}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.badge,
                        ...(isOnline(driver) ? styles.badgeGreen : styles.badgeRed),
                      }}
                    >
                      {isOnline(driver) ? "متصل" : "غير متصل"}
                    </span>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.miniBox}>
                      <p style={styles.statLabel}>طلبات نشطة</p>
                      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 950 }}>
                        {activeOrders.length}
                      </p>
                    </div>

                    <div style={styles.miniBox}>
                      <p style={styles.statLabel}>مكتملة</p>
                      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 950 }}>
                        {delivered.length}
                      </p>
                    </div>

                    <div style={styles.miniBox}>
                      <p style={styles.statLabel}>تقدير الأرباح</p>
                      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 950, color: "#FFB56B" }}>
                        {revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div style={styles.actions}>
                    <button
                      onClick={() => updateDriverStatus(driver, true)}
                      disabled={savingDriverId === driver.documentId}
                      style={styles.onlineButton}
                    >
                      تشغيل
                    </button>

                    <button
                      onClick={() => updateDriverStatus(driver, false)}
                      disabled={savingDriverId === driver.documentId}
                      style={styles.offlineButton}
                    >
                      إيقاف
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {offlineDrivers.length > 0 ? null : null}
      </section>
    </main>
  );
}
