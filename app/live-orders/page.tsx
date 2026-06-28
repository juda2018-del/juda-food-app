"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_COOKIE_EMAIL,
  FUSE_COOKIE_NAME,
  FUSE_COOKIE_PHONE,
  FUSE_COOKIE_RESTAURANT,
  FUSE_COOKIE_ROLE,
  FUSE_LOCAL_SESSION,
  navForRole,
  parseFuseRole,
  roleHome,
  roleTitle,
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type LiveOrderItem = {
  name?: string;
  title?: string;
  price?: number;
  qty?: number;
  quantity?: number;
};

type LiveOrder = {
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
  driverName?: string;
  driverPhone?: string;
  createdAt?: unknown;
  items?: LiveOrderItem[];
};

const statusSteps = ["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];
const statusFilters = ["الكل", "جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم", "مرفوض"];

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function cleanPhone(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function getStoredSession(): FuseSession | null {
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

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

function getOrderTotal(order: LiveOrder) {
  return Number(order.total || order.amount || 0);
}

function getOrderCustomer(order: LiveOrder) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getOrderPhone(order: LiveOrder) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: LiveOrder) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function isActiveOrder(status?: string) {
  const clean = normalizeStatus(status);
  return clean !== "تم التسليم" && clean !== "مرفوض";
}

function canSeeOrder(
  order: LiveOrder,
  role: FuseRole | null,
  session: FuseSession | null,
  phoneSearch: string
) {
  if (!role || !session) return false;

  if (role === "admin") return true;

  if (role === "restaurant") {
    if (!session.restaurant) return true;
    return getRestaurant(order) === session.restaurant;
  }

  if (role === "driver") {
    const driverPhone = cleanPhone(order.driverPhone);
    const sessionPhone = cleanPhone(session.phone);

    if (order.driverName && order.driverName === session.name) return true;
    if (driverPhone && sessionPhone && driverPhone.includes(sessionPhone)) return true;

    return false;
  }

  const queryPhone = cleanPhone(phoneSearch);
  const savedPhone = cleanPhone(session.phone);
  const orderPhone = cleanPhone(getOrderPhone(order));
  const targetPhone = queryPhone.length >= 5 ? queryPhone : savedPhone;

  if (!targetPhone || !orderPhone) return false;

  return orderPhone.includes(targetPhone) || targetPhone.includes(orderPhone);
}

function matchesOpsSearch(order: LiveOrder, searchText: string) {
  const cleanSearch = searchText.trim().toLowerCase();
  if (!cleanSearch) return true;

  const haystack = [
    getOrderCustomer(order),
    getOrderPhone(order),
    order.address || "",
    getRestaurant(order),
    order.driverName || "",
    order.driverPhone || "",
    order.orderId || "",
    order.documentId || "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(cleanSearch);
}

function statusBadgeStyle(status?: string): CSSProperties {
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
    background: "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 33%), #050505",
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
  topActions: {
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
  button: {
    border: 0,
    borderRadius: 16,
    background: "#FF7A00",
    color: "#000",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
  },
  logout: {
    border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: 16,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background: "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.09))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  customerHeroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.55fr)",
    gap: 14,
    alignItems: "stretch",
  },
  opsHeroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1.15fr) repeat(4, minmax(160px, 0.55fr))",
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
    minHeight: 120,
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
    lineHeight: 1.08,
    fontWeight: 950,
  },
  opsTitle: {
    margin: "8px 0 0",
    fontSize: "clamp(32px, 4vw, 50px)",
    lineHeight: 1.1,
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
  filterPanel: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1fr) minmax(200px, 0.5fr)",
    gap: 12,
    alignItems: "end",
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
  nav: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  navItem: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    background: "rgba(255,255,255,0.045)",
    padding: "12px 14px",
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
    textAlign: "center",
  },
  ordersGrid: {
    display: "grid",
    gap: 14,
  },
  orderCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  orderTop: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1fr) minmax(200px, 0.45fr)",
    gap: 12,
    alignItems: "start",
  },
  orderMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  metaBox: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
  },
  totalBox: {
    border: "1px solid rgba(255,122,0,0.24)",
    borderRadius: 22,
    background: "rgba(255,122,0,0.10)",
    padding: 16,
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
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 18,
  },
  stepDot: {
    height: 8,
    borderRadius: 999,
  },
  itemsBox: {
    borderRadius: 22,
    background: "rgba(0,0,0,0.30)",
    padding: 14,
    marginTop: 14,
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.035)",
    padding: 28,
    textAlign: "center",
  },
};

export default function LiveOrdersPage() {
  const router = useRouter();

  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [opsSearch, setOpsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = getStoredSession();

    if (!saved) {
      window.location.href = "/login?next=/live-orders";
      return;
    }

    setSession(saved);

    if (saved.role === "customer") {
      setPhoneSearch(saved.phone || "");
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<LiveOrder, "documentId">),
          documentId: item.id,
        }));

        setOrders(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setError(snapshotError.message || "تعذر تحميل الطلبات");
        setOrders([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const role = session?.role || null;
  const isCustomer = role === "customer";
  const navItems = useMemo(() => navForRole(role), [role]);

  const roleOrders = useMemo(() => {
    return orders.filter((order) => canSeeOrder(order, role, session, phoneSearch));
  }, [orders, phoneSearch, role, session]);

  const visibleOrders = useMemo(() => {
    let result = roleOrders;

    if (!isCustomer) {
      result = result.filter((order) => {
        const sameStatus =
          statusFilter === "الكل" || normalizeStatus(order.status) === statusFilter;

        return sameStatus && matchesOpsSearch(order, opsSearch);
      });
    }

    return result.slice(0, isCustomer ? 10 : 80);
  }, [roleOrders, statusFilter, opsSearch, isCustomer]);

  const activeOrders = roleOrders.filter((order) => isActiveOrder(order.status)).length;
  const newOrders = roleOrders.filter((order) => normalizeStatus(order.status) === "جديد").length;
  const readyOrders = roleOrders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل").length;
  const deliveredOrders = roleOrders.filter(
    (order) => normalizeStatus(order.status) === "تم التسليم"
  ).length;

  function logout() {
    localStorage.removeItem(FUSE_LOCAL_SESSION);

    clearCookie(FUSE_COOKIE_ROLE);
    clearCookie(FUSE_COOKIE_EMAIL);
    clearCookie(FUSE_COOKIE_NAME);
    clearCookie(FUSE_COOKIE_PHONE);
    clearCookie(FUSE_COOKIE_RESTAURANT);

    router.replace("/login");
    router.refresh();
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <div style={styles.topActions}>
            <button onClick={() => router.push(role ? roleHome[role] : "/login")} style={styles.button}>
              لوحتي
            </button>
            <button onClick={logout} style={styles.logout}>
              خروج
            </button>
          </div>
        </div>

        {isCustomer ? (
          <header style={styles.hero}>
            <div style={styles.customerHeroGrid}>
              <div style={styles.card}>
                <p style={styles.eyebrow}>تتبع الطلب</p>
                <h1 style={styles.title}>
                  شوف طلبك
                  <br />
                  <span style={styles.orange}>وين وصل</span>
                </h1>
                <p style={styles.muted}>
                  اكتب رقم الهاتف المستخدم بالطلب، وراح تظهر حالة الطلب والتحديثات مباشرة.
                </p>
              </div>

              <div style={styles.card}>
                <p style={styles.statLabel}>حسابك</p>
                <h2 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 950 }}>
                  {session?.name || "زبون"}
                </h2>
                <p style={{ ...styles.muted, direction: "ltr" }}>{session?.email || ""}</p>
                <span style={{ ...styles.badge, ...styles.badgePurple }}>زبون</span>
              </div>
            </div>
          </header>
        ) : (
          <header style={styles.hero}>
            <div style={styles.opsHeroGrid}>
              <div style={styles.card}>
                <p style={styles.eyebrow}>لوحة التشغيل</p>
                <h1 style={styles.opsTitle}>
                  الطلبات
                  <br />
                  <span style={styles.orange}>المباشرة</span>
                </h1>
                <p style={styles.muted}>
                  عرض منظف حسب الدور: الإدارة تشوف الكل، المطعم يشوف مطعمه، والسائق يشوف طلباته.
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
                <p style={styles.statLabel}>طلبات جديدة</p>
                <p style={{ ...styles.statValue, color: "#FFB56B" }}>{newOrders}</p>
                <p style={styles.muted}>تحتاج متابعة</p>
              </div>

              <div style={styles.compactCard}>
                <p style={styles.statLabel}>جاهزة للتوصيل</p>
                <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{readyOrders}</p>
                <p style={styles.muted}>بانتظار سائق</p>
              </div>

              <div style={styles.compactCard}>
                <p style={styles.statLabel}>نشطة</p>
                <p style={{ ...styles.statValue, color: "#86EFAC" }}>{activeOrders}</p>
                <p style={styles.muted}>{loading ? "تحميل" : "مباشر"}</p>
              </div>
            </div>
          </header>
        )}

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link key={`${item.title}-${item.href}`} href={item.href} style={styles.navItem}>
              {item.title}
            </Link>
          ))}
        </nav>

        {isCustomer ? (
          <section style={styles.filterPanel}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                رقم الهاتف
              </span>
              <input
                value={phoneSearch}
                onChange={(event) => setPhoneSearch(event.target.value)}
                style={styles.input}
                placeholder="0770..."
                dir="ltr"
              />
            </label>
          </section>
        ) : (
          <section style={styles.filterPanel}>
            <div style={styles.filterGrid}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                  بحث سريع
                </span>
                <input
                  value={opsSearch}
                  onChange={(event) => setOpsSearch(event.target.value)}
                  style={styles.input}
                  placeholder="اسم الزبون، الهاتف، المطعم، السائق، العنوان..."
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                  فلترة الحالة
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={styles.select}
                >
                  {statusFilters.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        <section style={styles.ordersGrid}>
          {loading ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>جاري تحميل الطلبات...</h2>
              <p style={styles.muted}>الاتصال المباشر شغال.</p>
            </div>
          ) : error ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0, color: "#FCA5A5" }}>تعذر تحميل الطلبات</h2>
              <p style={styles.muted}>{error}</p>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>
                {isCustomer ? "ما لقينا طلب بهذا الرقم" : "ماكو طلبات مطابقة"}
              </h2>
              <p style={styles.muted}>
                {isCustomer
                  ? "اكتب نفس رقم الهاتف المستخدم بالطلب حتى يظهر طلبك."
                  : "غيّر البحث أو الفلتر حتى تظهر الطلبات."}
              </p>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const cleanStatus = normalizeStatus(order.status);
              const currentStepIndex = Math.max(0, statusSteps.indexOf(cleanStatus));

              return (
                <article key={order.documentId} style={styles.orderCard}>
                  <div style={styles.orderTop}>
                    <div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <h2 style={{ margin: 0, fontSize: 25, fontWeight: 950 }}>
                          {isCustomer ? getRestaurant(order) : getOrderCustomer(order)}
                        </h2>
                        <span style={{ ...styles.badge, ...statusBadgeStyle(cleanStatus) }}>
                          {cleanStatus}
                        </span>
                      </div>

                      <p style={styles.muted}>
                        {isCustomer
                          ? formatDate(order.createdAt)
                          : `${getRestaurant(order)} — ${formatDate(order.createdAt)}`}
                      </p>

                      {!isCustomer ? (
                        <div style={styles.orderMetaGrid}>
                          <div style={styles.metaBox}>
                            <p style={styles.statLabel}>الهاتف</p>
                            <p style={{ margin: "7px 0 0", direction: "ltr" }}>
                              {getOrderPhone(order) || "—"}
                            </p>
                          </div>

                          <div style={styles.metaBox}>
                            <p style={styles.statLabel}>العنوان</p>
                            <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                              {order.address || "بدون عنوان"}
                            </p>
                          </div>

                          <div style={styles.metaBox}>
                            <p style={styles.statLabel}>السائق</p>
                            <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                              {order.driverName || "غير محدد"}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div style={styles.totalBox}>
                      <p style={styles.statLabel}>المجموع</p>
                      <p style={{ ...styles.statValue, ...styles.orange }}>
                        {getOrderTotal(order).toLocaleString()} د.ع
                      </p>
                      <p style={styles.muted}>
                        رقم الطلب: {order.orderId || order.documentId.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div style={styles.steps}>
                    {statusSteps.map((step, index) => (
                      <div key={step}>
                        <div
                          style={{
                            ...styles.stepDot,
                            background: index <= currentStepIndex ? "#FF7A00" : "rgba(255,255,255,0.12)",
                          }}
                        />
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: index <= currentStepIndex ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.35)",
                            fontSize: 11,
                            fontWeight: 800,
                            textAlign: "center",
                          }}
                        >
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.items?.length ? (
                    <div style={styles.itemsBox}>
                      <p style={{ ...styles.eyebrow, marginBottom: 10 }}>تفاصيل الطلب</p>
                      {order.items.map((item, index) => (
                        <div
                          key={`${item.name || item.title || "item"}-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "8px 0",
                            borderBottom:
                              index === (order.items?.length || 0) - 1
                                ? "0"
                                : "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.70)",
                            fontSize: 14,
                          }}
                        >
                          <span>{item.name || item.title || "صنف"}</span>
                          <span>
                            ×{item.qty || item.quantity || 1}
                            {item.price ? ` — ${item.price.toLocaleString()} د.ع` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {order.driverName || order.driverPhone ? (
                    <div style={{ ...styles.itemsBox, background: "rgba(14,165,233,0.09)" }}>
                      <p style={{ margin: 0, color: "#7DD3FC", fontWeight: 950 }}>السائق</p>
                      <p style={styles.muted}>
                        {order.driverName || "تم اختيار سائق"}
                        {order.driverPhone ? ` — ${order.driverPhone}` : ""}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}
