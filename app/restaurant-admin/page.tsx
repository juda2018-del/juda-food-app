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
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type OrderItem = {
  name?: string;
  title?: string;
  price?: number;
  qty?: number;
  quantity?: number;
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
  driverName?: string;
  driverPhone?: string;
  createdAt?: unknown;
  items?: OrderItem[];
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  price?: number;
  available?: boolean;
  isAvailable?: boolean;
  createdAt?: unknown;
};

const statuses = [
  "جديد",
  "قيد التحضير",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التسليم",
  "مرفوض",
];

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

function getRestaurant(order: OrderDoc | MenuDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function getMenuName(item: MenuDoc) {
  return item.name || item.title || "صنف";
}

function menuAvailable(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
}

function canSeeRestaurantData(
  restaurant: string,
  role: FuseRole | null,
  session: FuseSession | null,
  selectedRestaurant: string
) {
  if (!role || !session) return false;

  if (role === "admin") {
    return selectedRestaurant === "الكل" || restaurant === selectedRestaurant;
  }

  if (role === "restaurant") {
    if (!session.restaurant) return true;
    return restaurant === session.restaurant;
  }

  return false;
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
    maxWidth: 1220,
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
  controls: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(170px, 0.4fr) minmax(170px, 0.4fr)",
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
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.42fr)",
    gap: 14,
    marginBottom: 16,
  },
  panel: {
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
  ordersGrid: {
    display: "grid",
    gap: 12,
    marginTop: 14,
  },
  orderCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.30)",
    padding: 16,
  },
  orderTop: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(170px, 0.35fr)",
    gap: 12,
    alignItems: "start",
  },
  totalBox: {
    border: "1px solid rgba(255,122,0,0.22)",
    borderRadius: 22,
    background: "rgba(255,122,0,0.08)",
    padding: 14,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  infoBox: {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    padding: 10,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    border: 0,
    borderRadius: 16,
    background: "#FF7A00",
    color: "#000",
    padding: "12px 13px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 950,
  },
  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "12px 13px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
  },
  dangerButton: {
    border: "1px solid rgba(239,68,68,0.32)",
    borderRadius: 16,
    background: "rgba(239,68,68,0.10)",
    color: "#FECACA",
    padding: "12px 13px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
  },
  formGrid: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  menuGrid: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  menuCard: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20,
    background: "rgba(0,0,0,0.26)",
    padding: 13,
  },
  menuTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
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

export default function RestaurantAdminPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [savingOrderId, setSavingOrderId] = useState("");
  const [savingMenuId, setSavingMenuId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();

    if (!saved) {
      window.location.href = "/login?next=/restaurant-admin";
      return;
    }

    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/live-orders";
      return;
    }

    setSession(saved);

    if (saved.role === "restaurant" && saved.restaurant) {
      setSelectedRestaurant(saved.restaurant);
    }
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

        data.sort((a, b) => {
          const ad = toDate(a.createdAt)?.getTime() || 0;
          const bd = toDate(b.createdAt)?.getTime() || 0;
          return bd - ad;
        });

        setOrders(data);
      },
      (snapshotError) => setError(snapshotError.message || "تعذر تحميل الطلبات")
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "menu"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MenuDoc, "documentId">),
          documentId: item.id,
        }));

        setMenu(data);
      },
      () => setMenu([])
    );

    return () => unsubscribe();
  }, []);

  const role = session?.role || null;

  const restaurants = useMemo(() => {
    const list = new Set<string>();

    orders.forEach((order) => list.add(getRestaurant(order)));
    menu.forEach((item) => list.add(getRestaurant(item)));

    return Array.from(list).filter(Boolean).sort();
  }, [menu, orders]);

  const visibleOrders = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return orders
      .filter((order) =>
        canSeeRestaurantData(getRestaurant(order), role, session, selectedRestaurant)
      )
      .filter((order) => statusFilter === "الكل" || normalizeStatus(order.status) === statusFilter)
      .filter((order) => {
        if (!cleanSearch) return true;

        const haystack = [
          getCustomer(order),
          getPhone(order),
          getRestaurant(order),
          order.address || "",
          order.driverName || "",
          order.orderId || "",
          order.documentId,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(cleanSearch);
      });
  }, [orders, role, search, selectedRestaurant, session, statusFilter]);

  const visibleMenu = useMemo(() => {
    return menu.filter((item) =>
      canSeeRestaurantData(getRestaurant(item), role, session, selectedRestaurant)
    );
  }, [menu, role, selectedRestaurant, session]);

  const newOrders = visibleOrders.filter((order) => normalizeStatus(order.status) === "جديد");
  const preparingOrders = visibleOrders.filter((order) => normalizeStatus(order.status) === "قيد التحضير");
  const readyOrders = visibleOrders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل");
  const deliveredOrders = visibleOrders.filter((order) => normalizeStatus(order.status) === "تم التسليم");

  const activeOrders = visibleOrders.filter((order) => {
    const status = normalizeStatus(order.status);
    return status !== "تم التسليم" && status !== "مرفوض";
  });

  const revenue = deliveredOrders.reduce((sum, order) => sum + getTotal(order), 0);
  const availableMenuCount = visibleMenu.filter(menuAvailable).length;

  async function updateOrderStatus(order: OrderDoc, status: string) {
    setSavingOrderId(order.documentId);
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "orders", order.documentId), {
        status,
        restaurantUpdatedAt: serverTimestamp(),
      });

      setMessage(`تم تحديث الطلب إلى: ${status}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تحديث الطلب");
    } finally {
      setSavingOrderId("");
    }
  }

  async function addMenuItem() {
    setMessage("");
    setError("");

    const restaurant =
      role === "restaurant" && session?.restaurant
        ? session.restaurant
        : selectedRestaurant !== "الكل"
          ? selectedRestaurant
          : restaurants[0] || "فيروز";

    if (!menuName.trim()) {
      setError("اكتب اسم الصنف.");
      return;
    }

    try {
      await addDoc(collection(db, "menu"), {
        name: menuName.trim(),
        title: menuName.trim(),
        price: Number(menuPrice || 0),
        category: menuCategory.trim() || "عام",
        restaurant,
        restaurantName: restaurant,
        available: true,
        isAvailable: true,
        createdAt: serverTimestamp(),
      });

      setMessage("تمت إضافة الصنف.");
      setMenuName("");
      setMenuPrice("");
      setMenuCategory("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إضافة الصنف");
    }
  }

  async function toggleMenu(item: MenuDoc) {
    setSavingMenuId(item.documentId);
    setMessage("");
    setError("");

    try {
      const next = !menuAvailable(item);

      await updateDoc(doc(db, "menu", item.documentId), {
        available: next,
        isAvailable: next,
        updatedAt: serverTimestamp(),
      });

      setMessage(next ? "تم تفعيل الصنف." : "تم إيقاف الصنف.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تحديث الصنف");
    } finally {
      setSavingMenuId("");
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
            <Link href="/restaurant-admin" style={styles.activePill}>
              لوحة المطعم
            </Link>
            <Link href="/live-orders" style={styles.pill}>
              الطلبات المباشرة
            </Link>
            <Link href="/notification-center" style={styles.pill}>
              الإشعارات
            </Link>
            <Link href="/reports" style={styles.pill}>
              التقارير
            </Link>
          </nav>

          <Link href={role ? roleHome[role] : "/login"} style={styles.pill}>
            لوحتي
          </Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>لوحة المطعم</p>
              <h1 style={styles.title}>
                الطلبات
                <br />
                <span style={styles.orange}>والمنيو مباشر</span>
              </h1>
              <p style={styles.muted}>
                لوحة تشغيل نظيفة لإدارة الطلبات، تحديث الحالات، متابعة الإيراد، وإدارة الأصناف.
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
              <p style={styles.statLabel}>طلبات نشطة</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{activeOrders.length}</p>
              <p style={styles.muted}>جديدة: {newOrders.length}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>جاهزة للتوصيل</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{readyOrders.length}</p>
              <p style={styles.muted}>قيد التحضير: {preparingOrders.length}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>مبيعات مكتملة</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>
                {revenue.toLocaleString()}
              </p>
              <p style={styles.muted}>دينار عراقي</p>
            </div>
          </div>
        </section>

        <section style={styles.controls}>
          <div style={styles.controlGrid}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>بحث سريع</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.input}
                placeholder="زبون، هاتف، عنوان، سائق..."
              />
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>المطعم</span>
              <select
                value={selectedRestaurant}
                onChange={(event) => setSelectedRestaurant(event.target.value)}
                style={styles.select}
                disabled={role === "restaurant"}
              >
                {role === "admin" ? <option value="الكل">الكل</option> : null}
                {restaurants.map((restaurant) => (
                  <option key={restaurant} value={restaurant}>
                    {restaurant}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={styles.statLabel}>الحالة</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.select}
              >
                {["الكل", ...statuses].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {message ? <div style={styles.messageOk}>{message}</div> : null}
          {error ? <div style={styles.messageBad}>{error}</div> : null}
        </section>

        <section style={styles.layout}>
          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>طلبات المطعم</h2>

            {visibleOrders.length === 0 ? (
              <div style={{ ...styles.empty, marginTop: 14 }}>
                <h3 style={{ margin: 0 }}>ماكو طلبات مطابقة</h3>
                <p style={styles.muted}>إذا وصل طلب جديد راح يظهر هنا مباشرة.</p>
              </div>
            ) : (
              <div style={styles.ordersGrid}>
                {visibleOrders.slice(0, 60).map((order) => {
                  const status = normalizeStatus(order.status);

                  return (
                    <article key={order.documentId} style={styles.orderCard}>
                      <div style={styles.orderTop}>
                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <h3 style={{ margin: 0, fontSize: 23, fontWeight: 950 }}>
                              {getCustomer(order)}
                            </h3>

                            <span style={{ ...styles.badge, ...statusStyle(status) }}>
                              {status}
                            </span>
                          </div>

                          <p style={styles.muted}>
                            {getRestaurant(order)} — {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div style={styles.totalBox}>
                          <p style={styles.statLabel}>المجموع</p>
                          <p style={{ ...styles.statValue, ...styles.orange }}>
                            {getTotal(order).toLocaleString()} د.ع
                          </p>
                        </div>
                      </div>

                      <div style={styles.infoGrid}>
                        <div style={styles.infoBox}>
                          <p style={styles.statLabel}>الهاتف</p>
                          <p style={{ margin: "7px 0 0", direction: "ltr" }}>
                            {getPhone(order) || "—"}
                          </p>
                        </div>

                        <div style={styles.infoBox}>
                          <p style={styles.statLabel}>العنوان</p>
                          <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                            {order.address || "بدون عنوان"}
                          </p>
                        </div>

                        <div style={styles.infoBox}>
                          <p style={styles.statLabel}>السائق</p>
                          <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                            {order.driverName || "غير محدد"}
                          </p>
                        </div>
                      </div>

                      {order.items?.length ? (
                        <div style={styles.infoBox}>
                          <p style={styles.statLabel}>تفاصيل الطلب</p>
                          <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                            {order.items
                              .map((item) => `${item.name || item.title || "صنف"} ×${item.qty || item.quantity || 1}`)
                              .join("، ")}
                          </p>
                        </div>
                      ) : null}

                      <div style={styles.actionGrid}>
                        <button
                          onClick={() => updateOrderStatus(order, "قيد التحضير")}
                          disabled={savingOrderId === order.documentId}
                          style={styles.secondaryButton}
                        >
                          قيد التحضير
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order, "جاهز للتوصيل")}
                          disabled={savingOrderId === order.documentId}
                          style={styles.actionButton}
                        >
                          جاهز للتوصيل
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order, "تم التسليم")}
                          disabled={savingOrderId === order.documentId}
                          style={styles.secondaryButton}
                        >
                          تم التسليم
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order, "مرفوض")}
                          disabled={savingOrderId === order.documentId}
                          style={styles.dangerButton}
                        >
                          رفض
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside style={styles.panel}>
            <h2 style={styles.sectionTitle}>المنيو</h2>
            <p style={styles.muted}>
              الأصناف الظاهرة: {visibleMenu.length} — المتاحة: {availableMenuCount}
            </p>

            <div style={styles.formGrid}>
              <input
                value={menuName}
                onChange={(event) => setMenuName(event.target.value)}
                style={styles.input}
                placeholder="اسم الصنف"
              />

              <input
                value={menuPrice}
                onChange={(event) => setMenuPrice(event.target.value)}
                style={styles.input}
                placeholder="السعر"
                dir="ltr"
              />

              <input
                value={menuCategory}
                onChange={(event) => setMenuCategory(event.target.value)}
                style={styles.input}
                placeholder="القسم"
              />

              <button onClick={addMenuItem} style={styles.actionButton}>
                إضافة صنف
              </button>
            </div>

            <div style={styles.menuGrid}>
              {visibleMenu.length === 0 ? (
                <div style={styles.empty}>
                  <h3 style={{ margin: 0 }}>ماكو أصناف حالياً</h3>
                  <p style={styles.muted}>أضف صنف جديد حتى يظهر هنا.</p>
                </div>
              ) : (
                visibleMenu.slice(0, 30).map((item) => (
                  <article key={item.documentId} style={styles.menuCard}>
                    <div style={styles.menuTop}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 950 }}>
                          {getMenuName(item)}
                        </h3>

                        <p style={{ ...styles.muted, margin: "7px 0 0" }}>
                          {item.category || "عام"} — {getRestaurant(item)}
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.badge,
                          ...(menuAvailable(item) ? styles.badgeGreen : styles.badgeRed),
                        }}
                      >
                        {menuAvailable(item) ? "متاح" : "متوقف"}
                      </span>
                    </div>

                    <p style={{ margin: "12px 0 0", color: "#FFB56B", fontWeight: 950 }}>
                      {Number(item.price || 0).toLocaleString()} د.ع
                    </p>

                    <button
                      onClick={() => toggleMenu(item)}
                      disabled={savingMenuId === item.documentId}
                      style={{
                        ...(menuAvailable(item) ? styles.dangerButton : styles.actionButton),
                        width: "100%",
                        marginTop: 12,
                      }}
                    >
                      {menuAvailable(item) ? "إيقاف الصنف" : "تفعيل الصنف"}
                    </button>
                  </article>
                ))
              )}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
