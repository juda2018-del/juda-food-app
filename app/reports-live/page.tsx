 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type OrderStatus =
  | "جديد"
  | "قيد التحضير"
  | "جاهز للتوصيل"
  | "قيد التوصيل"
  | "تم التسليم"
  | "مرفوض";

type LiveOrder = {
  docId: string;
  customerName?: string;
  customer?: string;
  phone?: string;
  area?: string;
  address?: string;
  restaurant?: string;
  restaurantDocId?: string;
  driverName?: string;
  driverPhone?: string;
  driverDocId?: string;
  total?: number;
  amount?: number;
  subtotal?: number;
  deliveryFee?: number;
  status?: OrderStatus | string;
  rated?: boolean;
  ratingAverage?: number;
  createdAt?: any;
  deliveredAt?: any;
};

type Rating = {
  docId: string;
  orderId?: string;
  customerName?: string;
  restaurant?: string;
  driverName?: string;
  restaurantRating?: number;
  driverRating?: number;
  deliveryRating?: number;
  average?: number;
  comment?: string;
  createdAt?: any;
};

type Restaurant = {
  docId: string;
  name?: string;
  open?: boolean;
  active?: boolean;
  area?: string;
  category?: string;
};

type Driver = {
  docId: string;
  name?: string;
  phone?: string;
  online?: boolean;
  active?: boolean;
  area?: string;
};

type MenuItem = {
  docId: string;
  name?: string;
  restaurant?: string;
  category?: string;
  price?: number;
  active?: boolean;
};

type GroupStat = {
  name: string;
  orders: number;
  delivered: number;
  active: number;
  rejected: number;
  revenue: number;
  avgRating: number;
};

const statuses: OrderStatus[] = [
  "جديد",
  "قيد التحضير",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التسليم",
  "مرفوض",
];

function normalizeStatus(status?: string): OrderStatus {
  if (status === "جاهز") return "جاهز للتوصيل";
  if (statuses.includes(status as OrderStatus)) return status as OrderStatus;
  return "جديد";
}

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function getOrderTotal(order?: LiveOrder) {
  if (!order) return 0;
  return Number(order.total || order.amount || 0);
}

function getCustomer(order?: LiveOrder) {
  if (!order) return "زبون";
  return order.customerName || order.customer || "زبون";
}

function getArea(order?: LiveOrder) {
  if (!order) return "بدون منطقة";
  return order.area || order.address || "بدون منطقة";
}

function avg(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length === 0) return 0;

  return Number(
    (valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1)
  );
}

function formatDate(value: any) {
  if (!value) return "بدون وقت";

  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value instanceof Date
        ? value
        : new Date(value);

    if (isNaN(date.getTime())) return "بدون وقت";

    return date.toLocaleString("ar-IQ", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "بدون وقت";
  }
}

function ratingText(value: number) {
  if (value >= 4.5) return "ممتاز";
  if (value >= 4) return "جيد جداً";
  if (value >= 3) return "متوسط";
  if (value > 0) return "يحتاج متابعة";
  return "بدون تقييم";
}

export default function ReportsLivePage() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"restaurants" | "drivers" | "areas">(
    "restaurants"
  );
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<LiveOrder, "docId">),
          docId: item.id,
        }));

        setOrders(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
        showToast("صار خطأ بقراءة الطلبات");
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "ratings"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<Rating, "docId">),
          docId: item.id,
        }));

        setRatings(data);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<Restaurant, "docId">),
          docId: item.id,
        }));

        setRestaurants(data);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "drivers"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<Driver, "docId">),
          docId: item.id,
        }));

        setDrivers(data);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<MenuItem, "docId">),
          docId: item.id,
        }));

        setMenu(data);
      },
      () => {}
    );

    return () => unsub();
  }, []);

  const deliveredOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "تم التسليم"
  );

  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(normalizeStatus(order.status))
  );

  const rejectedOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "مرفوض"
  );

  const readyOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "جاهز للتوصيل"
  );

  const deliveringOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "قيد التوصيل"
  );

  const revenue = deliveredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const expectedRevenue = activeOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const averageOrderValue =
    deliveredOrders.length > 0 ? Math.round(revenue / deliveredOrders.length) : 0;

  const averageRating = avg(ratings.map((rating) => Number(rating.average || 0)));

  const openRestaurants = restaurants.filter(
    (restaurant) => restaurant.active !== false && restaurant.open !== false
  ).length;

  const onlineDrivers = drivers.filter(
    (driver) => driver.active !== false && driver.online
  ).length;

  const activeMenu = menu.filter((item) => item.active !== false).length;

  const restaurantStats = useMemo(() => {
    const map = new Map<string, GroupStat>();

    orders.forEach((order) => {
      const name = order.restaurant || "مطعم غير محدد";
      const current =
        map.get(name) ||
        ({
          name,
          orders: 0,
          delivered: 0,
          active: 0,
          rejected: 0,
          revenue: 0,
          avgRating: 0,
        } satisfies GroupStat);

      const status = normalizeStatus(order.status);
      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (status === "مرفوض") {
        current.rejected += 1;
      }

      if (!["تم التسليم", "مرفوض"].includes(status)) {
        current.active += 1;
      }

      map.set(name, current);
    });

    const ratingMap = new Map<string, number[]>();
    ratings.forEach((rating) => {
      const name = rating.restaurant || "مطعم غير محدد";
      const list = ratingMap.get(name) || [];
      list.push(Number(rating.average || 0));
      ratingMap.set(name, list);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgRating: avg(ratingMap.get(item.name) || []),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, ratings]);

  const driverStats = useMemo(() => {
    const map = new Map<string, GroupStat>();

    orders.forEach((order) => {
      const name = order.driverName || "بدون سائق";
      const current =
        map.get(name) ||
        ({
          name,
          orders: 0,
          delivered: 0,
          active: 0,
          rejected: 0,
          revenue: 0,
          avgRating: 0,
        } satisfies GroupStat);

      const status = normalizeStatus(order.status);
      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (status === "مرفوض") {
        current.rejected += 1;
      }

      if (!["تم التسليم", "مرفوض"].includes(status)) {
        current.active += 1;
      }

      map.set(name, current);
    });

    const ratingMap = new Map<string, number[]>();
    ratings.forEach((rating) => {
      const name = rating.driverName || "بدون سائق";
      const list = ratingMap.get(name) || [];
      list.push(Number(rating.driverRating || rating.average || 0));
      ratingMap.set(name, list);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgRating: avg(ratingMap.get(item.name) || []),
      }))
      .sort((a, b) => b.delivered - a.delivered);
  }, [orders, ratings]);

  const areaStats = useMemo(() => {
    const map = new Map<string, GroupStat>();

    orders.forEach((order) => {
      const name = getArea(order).split("-")[0].trim() || "منطقة غير محددة";
      const current =
        map.get(name) ||
        ({
          name,
          orders: 0,
          delivered: 0,
          active: 0,
          rejected: 0,
          revenue: 0,
          avgRating: 0,
        } satisfies GroupStat);

      const status = normalizeStatus(order.status);
      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (status === "مرفوض") {
        current.rejected += 1;
      }

      if (!["تم التسليم", "مرفوض"].includes(status)) {
        current.active += 1;
      }

      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
  }, [orders]);

  const currentStats =
    view === "restaurants"
      ? restaurantStats
      : view === "drivers"
      ? driverStats
      : areaStats;

  const latestOrders = orders.slice(0, 8);
  const latestRatings = ratings.slice(0, 6);

  const aiSummary =
    readyOrders.length > 0
      ? `عدك ${readyOrders.length} طلب جاهز ينتظر توزيع، افتح Auto Dispatch حتى لا يصير تأخير.`
      : deliveringOrders.length > 0
      ? `عدك ${deliveringOrders.length} طلب بالطريق، راقب السائقين والتسليم.`
      : activeOrders.length > 0
      ? `النظام مستقر، عدك ${activeOrders.length} طلب نشط داخل التشغيل.`
      : "ماكو ضغط حالي، النظام هادئ.";

  return (
    <main dir="rtl" className="reports-page">
      <style jsx global>{`
        body {
          margin: 0;
          background: #050505;
        }

        * {
          box-sizing: border-box;
        }

        .reports-page {
          min-height: 100vh;
          color: white;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 122, 0, 0.18), transparent 32%),
            radial-gradient(circle at 88% 16%, rgba(56, 189, 248, 0.11), transparent 28%),
            radial-gradient(circle at 50% 96%, rgba(34, 197, 94, 0.08), transparent 34%),
            linear-gradient(135deg, #050505, #0d0d10 55%, #050505);
          font-family:
            Cairo,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .shell {
          width: min(1680px, calc(100% - 36px));
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 10, 11, 0.78);
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo {
          width: 58px;
          height: 58px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          color: #050505;
          font-size: 24px;
          font-weight: 1000;
          box-shadow: 0 16px 45px rgba(255, 122, 0, 0.28);
        }

        .brand h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
        }

        .brand p {
          margin: 5px 0 0;
          color: rgba(255, 255, 255, 0.45);
          font-size: 13px;
          font-weight: 850;
        }

        .nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .nav a {
          text-decoration: none;
          border-radius: 999px;
          padding: 12px 16px;
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 1000;
          font-size: 13px;
        }

        .nav a.main {
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          border: 0;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .hero-card,
        .ai-card,
        .panel {
          border-radius: 36px;
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            linear-gradient(135deg, rgba(255, 122, 0, 0.15), transparent 48%),
            rgba(12, 12, 14, 0.82);
          box-shadow: 0 24px 90px rgba(0, 0, 0, 0.34);
        }

        .kicker {
          display: inline-flex;
          padding: 10px 14px;
          border-radius: 999px;
          color: #ffb86b;
          border: 1px solid rgba(255, 122, 0, 0.24);
          background: rgba(255, 122, 0, 0.11);
          font-size: 13px;
          font-weight: 1000;
        }

        .hero-card h2 {
          margin: 20px 0 0;
          max-width: 850px;
          font-size: clamp(38px, 5vw, 74px);
          line-height: 1.05;
          letter-spacing: -2px;
          font-weight: 1000;
        }

        .hero-card h2 span {
          color: #ff7a00;
        }

        .hero-card p {
          margin: 18px 0 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.54);
          line-height: 2;
          font-weight: 850;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 25px;
        }

        .mini {
          border-radius: 24px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .mini strong {
          display: block;
          font-size: 25px;
          font-weight: 1000;
        }

        .mini small {
          display: block;
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 900;
        }

        .ai-card h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
        }

        .ai-box {
          margin-top: 18px;
          border-radius: 28px;
          padding: 18px;
          background: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.16);
        }

        .ai-box strong {
          display: block;
          color: #ff7a00;
          font-size: 22px;
          font-weight: 1000;
        }

        .ai-box p {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.6);
          line-height: 2;
          font-weight: 850;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .kpi {
          min-height: 132px;
          border-radius: 30px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background:
            radial-gradient(circle at left bottom, rgba(255, 122, 0, 0.13), transparent 48%),
            rgba(12, 12, 14, 0.82);
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.28);
        }

        .kpi p {
          margin: 0;
          color: rgba(255, 255, 255, 0.44);
          font-weight: 900;
          font-size: 13px;
        }

        .kpi strong {
          display: block;
          margin-top: 12px;
          font-size: 30px;
          line-height: 1.15;
          font-weight: 1000;
        }

        .kpi small {
          display: block;
          margin-top: 10px;
          color: rgba(255, 255, 255, 0.36);
          font-weight: 850;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 18px;
          align-items: start;
        }

        .tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .tab {
          flex: 0 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.06);
          color: white;
          border-radius: 999px;
          padding: 12px 17px;
          font-weight: 1000;
          cursor: pointer;
        }

        .tab.active {
          color: #050505;
          border-color: transparent;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
        }

        .panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 16px;
        }

        .panel-title h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 1000;
        }

        .table {
          display: grid;
          gap: 10px;
        }

        .row {
          display: grid;
          grid-template-columns: 1.2fr repeat(5, 0.7fr);
          gap: 10px;
          align-items: center;
          border-radius: 22px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .row.head {
          color: rgba(255, 255, 255, 0.42);
          font-size: 12px;
          font-weight: 1000;
          background: rgba(255, 255, 255, 0.04);
        }

        .row strong {
          font-weight: 1000;
        }

        .row span {
          color: rgba(255, 255, 255, 0.68);
          font-weight: 850;
        }

        .side-list {
          display: grid;
          gap: 12px;
        }

        .side-item {
          border-radius: 22px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .side-item small {
          display: block;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 900;
        }

        .side-item strong {
          display: block;
          margin-top: 6px;
          font-weight: 1000;
          line-height: 1.7;
        }

        .rating-card {
          border-radius: 22px;
          padding: 14px;
          background: rgba(255, 122, 0, 0.07);
          border: 1px solid rgba(255, 122, 0, 0.14);
        }

        .rating-card strong {
          display: block;
          font-weight: 1000;
        }

        .rating-card p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.52);
          line-height: 1.8;
          font-weight: 850;
        }

        .empty {
          min-height: 280px;
          display: grid;
          place-items: center;
          text-align: center;
          border-radius: 28px;
          border: 1px dashed rgba(255, 255, 255, 0.11);
          background: rgba(0, 0, 0, 0.24);
          color: rgba(255, 255, 255, 0.42);
          font-weight: 1000;
          line-height: 2;
        }

        .toast {
          position: fixed;
          left: 18px;
          top: 18px;
          z-index: 60;
          padding: 15px 18px;
          border-radius: 22px;
          border: 1px solid rgba(255, 122, 0, 0.32);
          background: rgba(15, 15, 15, 0.96);
          color: #ff7a00;
          font-weight: 1000;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
        }

        @media (max-width: 1400px) {
          .kpi-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 1180px) {
          .hero,
          .layout {
            grid-template-columns: 1fr;
          }

          .row {
            grid-template-columns: 1fr 1fr;
          }

          .row.head {
            display: none;
          }
        }

        @media (max-width: 720px) {
          .shell {
            width: min(100% - 24px, 1680px);
            padding-top: 12px;
          }

          .topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-stats,
          .kpi-grid,
          .row {
            grid-template-columns: 1fr;
          }

          .hero-card,
          .ai-card,
          .panel {
            padding: 18px;
          }
        }
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">F</div>
            <div>
              <h1>FUSE Reports Live</h1>
              <p>تقارير مباشرة من الطلبات والمطاعم والسائقين والمنيو والتقييمات</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">الرئيسية</a>
            <a href="/fuse-command-live">Command</a>
            <a href="/restaurants-admin">المطاعم</a>
            <a href="/drivers-admin">السائقين</a>
            <a href="/ratings">التقييمات</a>
            <a className="main" href="/reports-live">
              التقارير
            </a>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <div className="kicker">📈 REAL TIME BUSINESS REPORTS</div>

            <h2>
              تقارير فيوز صارت <span>Live</span>
            </h2>

            <p>
              هنا تشوف المبيعات، الطلبات النشطة، المطاعم، السائقين، المناطق،
              التقييمات، ومتوسط قيمة الطلب. كلشي ينسحب مباشرة من Firestore.
            </p>

            <div className="hero-stats">
              <div className="mini">
                <strong>{orders.length}</strong>
                <small>كل الطلبات</small>
              </div>

              <div className="mini">
                <strong>{formatMoney(revenue)}</strong>
                <small>مبيعات مسلّمة</small>
              </div>

              <div className="mini">
                <strong>{formatMoney(expectedRevenue)}</strong>
                <small>مبيعات نشطة</small>
              </div>

              <div className="mini">
                <strong>{averageRating || "--"}</strong>
                <small>{ratingText(averageRating)}</small>
              </div>
            </div>
          </div>

          <aside className="ai-card">
            <h3>Fuse AI Report</h3>

            <div className="ai-box">
              <strong>ملخص التشغيل</strong>
              <p>{aiSummary}</p>
            </div>

            <div className="ai-box">
              <strong>مؤشر الجودة</strong>
              <p>
                المعدل العام {averageRating || "--"}، وعدد التقييمات{" "}
                {ratings.length}. الطلبات المرفوضة {rejectedOrders.length}.
              </p>
            </div>
          </aside>
        </section>

        <section className="kpi-grid">
          <Kpi title="طلبات مسلّمة" value={deliveredOrders.length} hint="مكتملة" orange />
          <Kpi title="طلبات نشطة" value={activeOrders.length} hint="داخل التشغيل" />
          <Kpi title="جاهزة" value={readyOrders.length} hint="تنتظر Dispatch" />
          <Kpi title="بالطريق" value={deliveringOrders.length} hint="مع السائقين" />
          <Kpi title="مطاعم مفتوحة" value={openRestaurants} hint={`كل المطاعم: ${restaurants.length}`} />
          <Kpi title="سائقين متصلين" value={onlineDrivers} hint={`كل السائقين: ${drivers.length}`} />
          <Kpi title="متوسط الطلب" value={formatMoney(averageOrderValue)} hint={`منيو متاح: ${activeMenu}`} />
        </section>

        <section className="layout">
          <div className="panel">
            <div className="panel-title">
              <h3>تحليل الأداء</h3>
              <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                {view === "restaurants"
                  ? "حسب المطعم"
                  : view === "drivers"
                  ? "حسب السائق"
                  : "حسب المنطقة"}
              </span>
            </div>

            <div className="tabs">
              <button
                onClick={() => setView("restaurants")}
                className={`tab ${view === "restaurants" ? "active" : ""}`}
              >
                المطاعم
              </button>

              <button
                onClick={() => setView("drivers")}
                className={`tab ${view === "drivers" ? "active" : ""}`}
              >
                السائقين
              </button>

              <button
                onClick={() => setView("areas")}
                className={`tab ${view === "areas" ? "active" : ""}`}
              >
                المناطق
              </button>
            </div>

            {loading ? (
              <div className="empty">جاري تحميل التقارير...</div>
            ) : currentStats.length === 0 ? (
              <div className="empty">
                ماكو بيانات كافية بعد.
                <br />
                سوّي طلب جديد وسلّمه حتى تطلع التقارير.
              </div>
            ) : (
              <div className="table">
                <div className="row head">
                  <span>الاسم</span>
                  <span>طلبات</span>
                  <span>نشطة</span>
                  <span>مسلّمة</span>
                  <span>مبيعات</span>
                  <span>تقييم</span>
                </div>

                {currentStats.slice(0, 14).map((item) => (
                  <div key={item.name} className="row">
                    <strong>{item.name}</strong>
                    <span>{item.orders}</span>
                    <span>{item.active}</span>
                    <span>{item.delivered}</span>
                    <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                      {formatMoney(item.revenue)}
                    </span>
                    <span>{item.avgRating || "--"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="panel">
            <div className="panel-title">
              <h3>آخر الطلبات</h3>
              <span style={{ color: "rgba(255,255,255,.42)", fontWeight: 900 }}>
                Live
              </span>
            </div>

            <div className="side-list">
              {latestOrders.length === 0 ? (
                <div className="empty">ماكو طلبات بعد</div>
              ) : (
                latestOrders.map((order) => (
                  <div key={order.docId} className="side-item">
                    <small>#{order.docId.slice(0, 10)}</small>
                    <strong>
                      {getCustomer(order)} — {normalizeStatus(order.status)}
                    </strong>
                    <small>
                      {order.restaurant || "مطعم"} · {formatMoney(getOrderTotal(order))} ·{" "}
                      {formatDate(order.createdAt)}
                    </small>
                  </div>
                ))
              )}
            </div>

            <div className="panel-title" style={{ marginTop: 22 }}>
              <h3>آخر التقييمات</h3>
            </div>

            <div className="side-list">
              {latestRatings.length === 0 ? (
                <div className="rating-card">
                  <strong>لا توجد تقييمات بعد</strong>
                  <p>بعد تسليم الطلب افتح ratings واحفظ تقييم.</p>
                </div>
              ) : (
                latestRatings.map((rating) => (
                  <div key={rating.docId} className="rating-card">
                    <strong>
                      ⭐ {rating.average || "--"} — {rating.restaurant || "مطعم"}
                    </strong>
                    <p>
                      {rating.comment || "بدون تعليق"}
                      <br />
                      {rating.driverName ? `السائق: ${rating.driverName}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Kpi({
  title,
  value,
  hint,
  orange,
}: {
  title: string;
  value: string | number;
  hint: string;
  orange?: boolean;
}) {
  return (
    <div className="kpi">
      <p>{title}</p>
      <strong style={{ color: orange ? "#FF7A00" : "white" }}>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}