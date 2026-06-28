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
  driverName?: string;
  driverPhone?: string;
  total?: number;
  amount?: number;
  subtotal?: number;
  deliveryFee?: number;
  status?: OrderStatus | string;
  rated?: boolean;
  ratingAverage?: number;
  createdAt?: any;
  updatedAt?: any;
};

type Restaurant = {
  docId: string;
  name?: string;
  area?: string;
  category?: string;
  open?: boolean;
  active?: boolean;
};

type Driver = {
  docId: string;
  name?: string;
  phone?: string;
  area?: string;
  online?: boolean;
  active?: boolean;
};

type MenuItem = {
  docId: string;
  name?: string;
  restaurant?: string;
  category?: string;
  price?: number;
  active?: boolean;
};

type Rating = {
  docId: string;
  orderId?: string;
  restaurant?: string;
  driverName?: string;
  average?: number;
  restaurantRating?: number;
  driverRating?: number;
  deliveryRating?: number;
  comment?: string;
  createdAt?: any;
};

type GroupStat = {
  name: string;
  orders: number;
  active: number;
  delivered: number;
  rejected: number;
  revenue: number;
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

function statusColor(status?: string) {
  const clean = normalizeStatus(status);

  if (clean === "جديد") return "#FF7A00";
  if (clean === "قيد التحضير") return "#FACC15";
  if (clean === "جاهز للتوصيل") return "#38BDF8";
  if (clean === "قيد التوصيل") return "#A855F7";
  if (clean === "تم التسليم") return "#22C55E";
  return "#EF4444";
}

export default function FuseCommandLivePage() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"orders" | "restaurants" | "drivers" | "quality">(
    "orders"
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

  const newOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "جديد"
  );

  const preparingOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "قيد التحضير"
  );

  const readyOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "جاهز للتوصيل"
  );

  const deliveringOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "قيد التوصيل"
  );

  const deliveredOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "تم التسليم"
  );

  const rejectedOrders = orders.filter(
    (order) => normalizeStatus(order.status) === "مرفوض"
  );

  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(normalizeStatus(order.status))
  );

  const revenue = deliveredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const expectedRevenue = activeOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const openRestaurants = restaurants.filter(
    (restaurant) => restaurant.active !== false && restaurant.open !== false
  );

  const closedRestaurants = restaurants.filter(
    (restaurant) => restaurant.active !== false && restaurant.open === false
  );

  const onlineDrivers = drivers.filter(
    (driver) => driver.active !== false && driver.online
  );

  const offlineDrivers = drivers.filter(
    (driver) => driver.active !== false && !driver.online
  );

  const activeMenuItems = menu.filter((item) => item.active !== false);

  const averageRating = avg(ratings.map((rating) => Number(rating.average || 0)));

  const restaurantStats = useMemo(() => {
    const map = new Map<string, GroupStat>();

    orders.forEach((order) => {
      const name = order.restaurant || "مطعم غير محدد";
      const current =
        map.get(name) || {
          name,
          orders: 0,
          active: 0,
          delivered: 0,
          rejected: 0,
          revenue: 0,
        };

      const status = normalizeStatus(order.status);

      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (status === "مرفوض") current.rejected += 1;

      if (!["تم التسليم", "مرفوض"].includes(status)) current.active += 1;

      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const driverStats = useMemo(() => {
    const map = new Map<string, GroupStat>();

    orders.forEach((order) => {
      const name = order.driverName || "بدون سائق";
      const current =
        map.get(name) || {
          name,
          orders: 0,
          active: 0,
          delivered: 0,
          rejected: 0,
          revenue: 0,
        };

      const status = normalizeStatus(order.status);

      current.orders += 1;

      if (status === "تم التسليم") {
        current.delivered += 1;
        current.revenue += getOrderTotal(order);
      }

      if (status === "مرفوض") current.rejected += 1;

      if (!["تم التسليم", "مرفوض"].includes(status)) current.active += 1;

      map.set(name, current);
    });

    return Array.from(map.values()).sort((a, b) => b.delivered - a.delivered);
  }, [orders]);

  const areaStats = useMemo(() => {
    const map = new Map<string, number>();

    orders.forEach((order) => {
      const area = getArea(order).split("-")[0].trim() || "بدون منطقة";
      map.set(area, (map.get(area) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const latestOrders = orders.slice(0, 8);
  const latestRatings = ratings.slice(0, 5);

  const commandStatus =
    readyOrders.length >= 3
      ? "ضغط توصيل"
      : newOrders.length >= 3
      ? "ضغط طلبات جديدة"
      : onlineDrivers.length === 0 && activeOrders.length > 0
      ? "نقص سائقين"
      : rejectedOrders.length >= 3
      ? "مشكلة قبول طلبات"
      : "النظام مستقر";

  const commandColor =
    commandStatus === "النظام مستقر"
      ? "#22C55E"
      : commandStatus === "نقص سائقين"
      ? "#EF4444"
      : "#FF7A00";

  const aiRecommendations = [
    readyOrders.length > 0
      ? `عدك ${readyOrders.length} طلب جاهز، افتح Auto Dispatch ووزّعها بسرعة.`
      : "ماكو طلبات جاهزة تنتظر السائق حالياً.",
    onlineDrivers.length === 0 && activeOrders.length > 0
      ? "ماكو سائق متصل وعدك طلبات نشطة، لازم تشغل سائق فوراً."
      : `السائقين المتصلين حالياً ${onlineDrivers.length}.`,
    newOrders.length > 0
      ? `عدك ${newOrders.length} طلب جديد يحتاج قبول من المطعم.`
      : "ماكو طلبات جديدة معلقة.",
    averageRating > 0 && averageRating < 3
      ? "معدل التقييم منخفض، راجع التعليقات من صفحة Ratings."
      : `معدل التقييم الحالي ${averageRating || "--"}.`,
  ];

  return (
    <main dir="rtl" className="command-page">
      <style jsx global>{`
        body {
          margin: 0;
          background: #050505;
        }

        * {
          box-sizing: border-box;
        }

        .command-page {
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

        .status-box {
          margin-top: 24px;
          border-radius: 28px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .status-box small {
          display: block;
          color: rgba(255, 255, 255, 0.42);
          font-weight: 900;
        }

        .status-box strong {
          display: block;
          margin-top: 8px;
          font-size: 34px;
          font-weight: 1000;
        }

        .ai-card h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
        }

        .ai-list {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .ai-item {
          border-radius: 22px;
          padding: 14px;
          background: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.16);
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.8;
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

        .cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .mini-card {
          border-radius: 24px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .mini-card small {
          display: block;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 900;
        }

        .mini-card strong {
          display: block;
          margin-top: 7px;
          font-weight: 1000;
          line-height: 1.7;
        }

        .table {
          display: grid;
          gap: 10px;
        }

        .row {
          display: grid;
          grid-template-columns: 1.3fr repeat(4, 0.7fr);
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

        .quick-links {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .quick-links a {
          text-decoration: none;
          text-align: center;
          border-radius: 20px;
          padding: 14px 12px;
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 1000;
        }

        .quick-links a.hot {
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          border: 0;
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

          .kpi-grid,
          .cards,
          .quick-links,
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
              <h1>FUSE Command Live</h1>
              <p>مركز القيادة الأعلى — يقرأ كل النظام Live من Firestore</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">الرئيسية</a>
            <a href="/live-orders">طلب جديد</a>
            <a href="/restaurant-live">المطعم</a>
            <a href="/driver-live">السائق</a>
            <a href="/auto-dispatch">Dispatch</a>
            <a href="/reports-live">التقارير</a>
            <a className="main" href="/fuse-command-live">
              Command
            </a>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <div className="kicker">👑 CEO LIVE CONTROL TOWER</div>

            <h2>
              مركز قيادة فيوز <span>صار Live كامل</span>
            </h2>

            <p>
              من هنا تشوف ضغط الطلبات، المطاعم المفتوحة، السائقين المتصلين،
              المنيو، المبيعات، التقييمات، والتنبيهات التشغيلية بنفس اللحظة.
            </p>

            <div className="status-box">
              <small>حالة النظام الحالية</small>
              <strong style={{ color: commandColor }}>{commandStatus}</strong>
            </div>
          </div>

          <aside className="ai-card">
            <h3>Fuse AI Command</h3>

            <div className="ai-list">
              {aiRecommendations.map((item, index) => (
                <div key={index} className="ai-item">
                  {item}
                </div>
              ))}
            </div>

            <div className="quick-links">
              <a className="hot" href="/auto-dispatch">
                Auto Dispatch
              </a>
              <a href="/restaurant-live">لوحة المطعم</a>
              <a href="/drivers-admin">السائقين</a>
              <a href="/reports-live">التقارير</a>
            </div>
          </aside>
        </section>

        <section className="kpi-grid">
          <Kpi title="كل الطلبات" value={orders.length} hint="إجمالي" />
          <Kpi title="طلبات نشطة" value={activeOrders.length} hint="داخل التشغيل" orange />
          <Kpi title="طلبات جديدة" value={newOrders.length} hint="تحتاج قبول" />
          <Kpi title="جاهزة" value={readyOrders.length} hint="تحتاج سائق" />
          <Kpi title="مطاعم مفتوحة" value={openRestaurants.length} hint={`مغلقة: ${closedRestaurants.length}`} />
          <Kpi title="سائقين متصلين" value={onlineDrivers.length} hint={`غير متصل: ${offlineDrivers.length}`} />
          <Kpi title="المبيعات" value={formatMoney(revenue)} hint={`نشطة: ${formatMoney(expectedRevenue)}`} />
        </section>

        <section className="layout">
          <div className="panel">
            <div className="panel-title">
              <h3>Command View</h3>
              <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                {view === "orders"
                  ? "الطلبات"
                  : view === "restaurants"
                  ? "المطاعم"
                  : view === "drivers"
                  ? "السائقين"
                  : "الجودة"}
              </span>
            </div>

            <div className="tabs">
              <button
                onClick={() => setView("orders")}
                className={`tab ${view === "orders" ? "active" : ""}`}
              >
                الطلبات
              </button>

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
                onClick={() => setView("quality")}
                className={`tab ${view === "quality" ? "active" : ""}`}
              >
                الجودة
              </button>
            </div>

            {loading ? (
              <div className="empty">جاري تحميل مركز القيادة...</div>
            ) : view === "orders" ? (
              <div className="table">
                <div className="row head">
                  <span>الطلب</span>
                  <span>المطعم</span>
                  <span>الحالة</span>
                  <span>المبلغ</span>
                  <span>الوقت</span>
                </div>

                {latestOrders.length === 0 ? (
                  <div className="empty">ماكو طلبات بعد</div>
                ) : (
                  latestOrders.map((order) => (
                    <div key={order.docId} className="row">
                      <strong>{getCustomer(order)}</strong>
                      <span>{order.restaurant || "مطعم"}</span>
                      <span style={{ color: statusColor(order.status), fontWeight: 1000 }}>
                        {normalizeStatus(order.status)}
                      </span>
                      <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                        {formatMoney(getOrderTotal(order))}
                      </span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            ) : view === "restaurants" ? (
              <div className="table">
                <div className="row head">
                  <span>المطعم</span>
                  <span>طلبات</span>
                  <span>نشطة</span>
                  <span>مسلّمة</span>
                  <span>مبيعات</span>
                </div>

                {restaurantStats.length === 0 ? (
                  <div className="empty">ماكو بيانات مطاعم بعد</div>
                ) : (
                  restaurantStats.slice(0, 12).map((item) => (
                    <div key={item.name} className="row">
                      <strong>{item.name}</strong>
                      <span>{item.orders}</span>
                      <span>{item.active}</span>
                      <span>{item.delivered}</span>
                      <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                        {formatMoney(item.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : view === "drivers" ? (
              <div className="table">
                <div className="row head">
                  <span>السائق</span>
                  <span>طلبات</span>
                  <span>نشطة</span>
                  <span>مسلّمة</span>
                  <span>مبيعات</span>
                </div>

                {driverStats.length === 0 ? (
                  <div className="empty">ماكو بيانات سائقين بعد</div>
                ) : (
                  driverStats.slice(0, 12).map((item) => (
                    <div key={item.name} className="row">
                      <strong>{item.name}</strong>
                      <span>{item.orders}</span>
                      <span>{item.active}</span>
                      <span>{item.delivered}</span>
                      <span style={{ color: "#FF7A00", fontWeight: 1000 }}>
                        {formatMoney(item.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="cards">
                <Info title="معدل التقييم" value={String(averageRating || "--")} orange />
                <Info title="عدد التقييمات" value={String(ratings.length)} />
                <Info title="طلبات مرفوضة" value={String(rejectedOrders.length)} />
                <Info title="أصناف متاحة" value={String(activeMenuItems.length)} />
                {latestRatings.map((rating) => (
                  <div key={rating.docId} className="mini-card">
                    <small>⭐ {rating.average || "--"}</small>
                    <strong>
                      {rating.restaurant || "مطعم"} —{" "}
                      {rating.driverName || "بدون سائق"}
                    </strong>
                    <small>{rating.comment || "بدون تعليق"}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="panel">
            <div className="panel-title">
              <h3>Live Side Monitor</h3>
            </div>

            <div className="side-list">
              <div className="side-item">
                <small>ضغط المطبخ</small>
                <strong>
                  {newOrders.length + preparingOrders.length} طلب داخل المطاعم
                </strong>
              </div>

              <div className="side-item">
                <small>ضغط التوصيل</small>
                <strong>
                  {readyOrders.length + deliveringOrders.length} طلب يحتاج متابعة
                </strong>
              </div>

              <div className="side-item">
                <small>المناطق الأعلى طلباً</small>
                <strong>
                  {areaStats.length > 0
                    ? areaStats
                        .slice(0, 3)
                        .map((area) => `${area.name} (${area.count})`)
                        .join(" · ")
                    : "ماكو بيانات مناطق"}
                </strong>
              </div>

              <div className="side-item">
                <small>حالة المطاعم</small>
                <strong>
                  مفتوحة {openRestaurants.length} · مغلقة {closedRestaurants.length}
                </strong>
              </div>

              <div className="side-item">
                <small>حالة السائقين</small>
                <strong>
                  متصل {onlineDrivers.length} · غير متصل {offlineDrivers.length}
                </strong>
              </div>

              <div className="side-item">
                <small>المنيو</small>
                <strong>
                  أصناف متاحة {activeMenuItems.length} من أصل {menu.length}
                </strong>
              </div>
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

function Info({
  title,
  value,
  orange,
}: {
  title: string;
  value: string;
  orange?: boolean;
}) {
  return (
    <div className="mini-card">
      <small>{title}</small>
      <strong style={{ color: orange ? "#FF7A00" : "white" }}>{value}</strong>
    </div>
  );
}