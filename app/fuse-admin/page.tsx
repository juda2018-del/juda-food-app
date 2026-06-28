"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  roleTitle,
  type FuseSession,
} from "@/lib/fuse-auth";

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
};

type DriverDoc = {
  documentId: string;
  name?: string;
  driverName?: string;
  phone?: string;
  driverPhone?: string;
  status?: string;
  online?: boolean;
  isOnline?: boolean;
  rating?: number;
};

type RestaurantDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  status?: string;
  open?: boolean;
  isOpen?: boolean;
};

type MenuDoc = {
  documentId: string;
  name?: string;
  title?: string;
  restaurant?: string;
  restaurantName?: string;
  available?: boolean;
  isAvailable?: boolean;
};

type RatingDoc = {
  documentId: string;
  restaurantRating?: number;
  driverRating?: number;
  restaurant?: string;
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

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  return status;
}

function getRestaurant(order: OrderDoc | MenuDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getRestaurantName(item: RestaurantDoc) {
  return item.name || item.title || item.restaurant || "مطعم";
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

function isActiveOrder(order: OrderDoc) {
  const status = normalizeStatus(order.status);
  return status !== "تم التسليم" && status !== "مرفوض";
}

function isOnlineDriver(driver: DriverDoc) {
  return driver.online === true || driver.isOnline === true || driver.status === "متصل";
}

function isOpenRestaurant(item: RestaurantDoc) {
  return item.open === true || item.isOpen === true || item.status === "مفتوح";
}

function isAvailableMenu(item: MenuDoc) {
  return item.available !== false && item.isAvailable !== false;
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
    maxWidth: 1240,
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
    fontSize: "clamp(36px, 5vw, 62px)",
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
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 22,
    background: "rgba(255,255,255,0.045)",
    padding: 16,
    color: "white",
    textDecoration: "none",
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
  rowList: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1fr) 130px 130px",
    gap: 10,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
  },
  restaurantRow: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 1fr) 110px 110px",
    gap: 10,
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    background: "rgba(0,0,0,0.26)",
    padding: 12,
  },
  smallGrid: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },
  miniBox: {
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20,
    background: "rgba(0,0,0,0.26)",
    padding: 14,
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
    borderRadius: 24,
    background: "rgba(255,255,255,0.035)",
    padding: 24,
    textAlign: "center",
  },
};

export default function FuseAdminPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [ratings, setRatings] = useState<RatingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = readSession();

    if (!saved) {
      window.location.href = "/login?next=/fuse-admin";
      return;
    }

    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/live-orders";
      return;
    }

    setSession(saved);
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
    const unsubscribe = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        setDrivers(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<DriverDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      () => setDrivers([])
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "restaurants")),
      (snapshot) => {
        setRestaurants(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<RestaurantDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      () => setRestaurants([])
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "menu")),
      (snapshot) => {
        setMenu(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<MenuDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      () => setMenu([])
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "ratings")),
      (snapshot) => {
        setRatings(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<RatingDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      () => setRatings([])
    );

    return () => unsubscribe();
  }, []);

  const activeOrders = orders.filter(isActiveOrder);
  const newOrders = orders.filter((order) => normalizeStatus(order.status) === "جديد");
  const preparingOrders = orders.filter((order) => normalizeStatus(order.status) === "قيد التحضير");
  const readyOrders = orders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل");
  const deliveringOrders = orders.filter((order) => normalizeStatus(order.status) === "قيد التوصيل");
  const deliveredOrders = orders.filter((order) => normalizeStatus(order.status) === "تم التسليم");

  const revenue = deliveredOrders.reduce((sum, order) => sum + getTotal(order), 0);
  const onlineDrivers = drivers.filter(isOnlineDriver);
  const openRestaurants = restaurants.filter(isOpenRestaurant);
  const availableMenu = menu.filter(isAvailableMenu);

  const avgRestaurantRating = average(ratings.map((rating) => Number(rating.restaurantRating || 0)));
  const avgDriverRating = average(ratings.map((rating) => Number(rating.driverRating || 0)));

  const restaurantStats = useMemo(() => {
    const map = new Map<string, { orders: number; revenue: number; active: number }>();

    for (const order of orders) {
      const restaurant = getRestaurant(order);
      const current = map.get(restaurant) || { orders: 0, revenue: 0, active: 0 };
      const status = normalizeStatus(order.status);

      map.set(restaurant, {
        orders: current.orders + 1,
        active: current.active + (isActiveOrder(order) ? 1 : 0),
        revenue: current.revenue + (status === "تم التسليم" ? getTotal(order) : 0),
      });
    }

    return Array.from(map.entries())
      .map(([restaurant, value]) => ({ restaurant, ...value }))
      .sort((a, b) => b.active - a.active || b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders]);

  const latestOrders = orders.slice(0, 10);

  const quickLinks = [
    { title: "الطلبات المباشرة", desc: "متابعة كل الطلبات", href: "/live-orders", icon: "📡" },
    { title: "لوحة المطعم", desc: "طلبات ومنيو المطاعم", href: "/restaurant-admin", icon: "🍽️" },
    { title: "التوزيع التلقائي", desc: "ربط الطلبات بالسائقين", href: "/auto-dispatch", icon: "⚡" },
    { title: "إدارة السائقين", desc: "تشغيل وإيقاف السائقين", href: "/drivers-admin", icon: "🛵" },
    { title: "التقارير", desc: "المبيعات والأداء", href: "/reports", icon: "📊" },
    { title: "أدوات النظام", desc: "تنظيف وفحص Firestore", href: "/system-tools", icon: "🧰" },
  ];

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.topBar}>
          <nav style={styles.nav}>
            <Link href="/" style={styles.pill}>
              الرئيسية
            </Link>
            <Link href="/fuse-admin" style={styles.activePill}>
              لوحة الإدارة
            </Link>
            <Link href="/live-orders" style={styles.pill}>
              الطلبات
            </Link>
            <Link href="/reports" style={styles.pill}>
              التقارير
            </Link>
            <Link href="/system-tools" style={styles.pill}>
              أدوات النظام
            </Link>
          </nav>

          <Link href="/" style={styles.pill}>
            FUSE Iraq
          </Link>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>لوحة الإدارة العليا</p>
              <h1 style={styles.title}>
                مركز قيادة
                <br />
                <span style={styles.orange}>FUSE التشغيلي</span>
              </h1>
              <p style={styles.muted}>
                متابعة الطلبات، المبيعات، المطاعم، السائقين، والتقييمات من مكان واحد.
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
              <p style={styles.statLabel}>طلبات نشطة</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>{activeOrders.length}</p>
              <p style={styles.muted}>جديدة: {newOrders.length}</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>المبيعات</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>
                {revenue.toLocaleString()}
              </p>
              <p style={styles.muted}>دينار عراقي</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>السائقين</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>
                {onlineDrivers.length}/{drivers.length}
              </p>
              <p style={styles.muted}>متصل / الكل</p>
            </div>
          </div>
        </section>

        <section style={styles.quickGrid}>
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} style={styles.quickCard}>
              <p style={styles.eyebrow}>{item.icon}</p>
              <h3 style={{ margin: "8px 0 0", fontSize: 19, fontWeight: 950 }}>
                {item.title}
              </h3>
              <p style={{ ...styles.muted, margin: "6px 0 0" }}>{item.desc}</p>
            </Link>
          ))}
        </section>

        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.compactCard}>
              <p style={styles.statLabel}>قيد التحضير</p>
              <p style={{ ...styles.statValue, color: "#FDE68A" }}>{preparingOrders.length}</p>
              <p style={styles.muted}>داخل المطبخ</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>جاهزة للتوصيل</p>
              <p style={{ ...styles.statValue, color: "#7DD3FC" }}>{readyOrders.length}</p>
              <p style={styles.muted}>تحتاج توزيع</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>قيد التوصيل</p>
              <p style={{ ...styles.statValue, color: "#D8B4FE" }}>{deliveringOrders.length}</p>
              <p style={styles.muted}>مع السائقين</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>المطاعم</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>
                {openRestaurants.length}/{restaurants.length || restaurantStats.length}
              </p>
              <p style={styles.muted}>مفتوح / الكل</p>
            </div>

            <div style={styles.compactCard}>
              <p style={styles.statLabel}>المنيو والتقييم</p>
              <p style={{ ...styles.statValue, color: "#FFB56B" }}>{availableMenu.length}</p>
              <p style={styles.muted}>
                مطعم {avgRestaurantRating.toFixed(1)} / سائق {avgDriverRating.toFixed(1)}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={styles.empty}>
            <h2 style={{ margin: 0 }}>جاري تحميل لوحة الإدارة...</h2>
            <p style={styles.muted}>انتظر لحظات.</p>
          </div>
        ) : (
          <section style={styles.layout}>
            <section style={styles.panel}>
              <h2 style={styles.sectionTitle}>آخر الطلبات</h2>

              <div style={styles.rowList}>
                {latestOrders.length === 0 ? (
                  <div style={styles.empty}>
                    <h3 style={{ margin: 0 }}>ماكو طلبات حالياً</h3>
                    <p style={styles.muted}>إذا وصل طلب جديد راح يظهر هنا.</p>
                  </div>
                ) : (
                  latestOrders.map((order) => (
                    <article key={order.documentId} style={styles.row}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 950 }}>
                          {getCustomer(order)}
                        </p>
                        <p style={{ ...styles.muted, margin: "6px 0 0" }}>
                          {getRestaurant(order)} — {formatDate(order.createdAt)}
                        </p>
                        <p style={{ ...styles.muted, margin: "6px 0 0", direction: "ltr" }}>
                          {getPhone(order) || "—"}
                        </p>
                      </div>

                      <span style={{ ...styles.badge, ...statusStyle(order.status) }}>
                        {normalizeStatus(order.status)}
                      </span>

                      <p style={{ margin: 0, color: "#FFB56B", fontWeight: 950 }}>
                        {getTotal(order).toLocaleString()} د.ع
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside style={styles.panel}>
              <h2 style={styles.sectionTitle}>أداء المطاعم</h2>

              <div style={styles.rowList}>
                {restaurantStats.length === 0 ? (
                  <div style={styles.empty}>
                    <h3 style={{ margin: 0 }}>ماكو بيانات مطاعم</h3>
                  </div>
                ) : (
                  restaurantStats.map((item) => (
                    <article key={item.restaurant} style={styles.restaurantRow}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 950 }}>
                          {item.restaurant}
                        </p>
                        <p style={{ ...styles.muted, margin: "6px 0 0" }}>
                          {item.orders} طلب
                        </p>
                      </div>

                      <p style={{ margin: 0, color: "#86EFAC", fontWeight: 950 }}>
                        {item.active}
                      </p>

                      <p style={{ margin: 0, color: "#FFB56B", fontWeight: 950 }}>
                        {item.revenue.toLocaleString()}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <div style={styles.smallGrid}>
                <div style={styles.miniBox}>
                  <p style={styles.statLabel}>مطاعم مسجلة</p>
                  <p style={{ ...styles.statValue, ...styles.orange }}>
                    {restaurants.length || restaurantStats.length}
                  </p>
                </div>

                <div style={styles.miniBox}>
                  <p style={styles.statLabel}>أصناف المنيو</p>
                  <p style={{ ...styles.statValue, color: "#7DD3FC" }}>
                    {menu.length}
                  </p>
                  <p style={styles.muted}>المتاحة: {availableMenu.length}</p>
                </div>

                <div style={styles.miniBox}>
                  <p style={styles.statLabel}>التقييمات</p>
                  <p style={{ ...styles.statValue, color: "#86EFAC" }}>
                    {ratings.length}
                  </p>
                </div>
              </div>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
