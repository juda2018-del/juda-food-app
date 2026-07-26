"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, roleHome, type FuseSession } from "@/lib/fuse-auth";

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
  assignedDriverName?: string;
  createdAt?: unknown;
};

type DriverDoc = { documentId: string; online?: boolean; isOnline?: boolean; status?: string };
type RestaurantDoc = { documentId: string; name?: string; title?: string; restaurantName?: string; open?: boolean; isOpen?: boolean; active?: boolean; status?: string };
type MenuDoc = { documentId: string; available?: boolean; isAvailable?: boolean };

const CLOSED_STATUSES = new Set(["تم التسليم", "مرفوض", "ملغي", "ملغى", "Cancelled", "Delivered"]);

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
  if (status === "جاهز" || status === "ready" || status === "ready_for_delivery") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  if (status === "Delivered") return "تم التسليم";
  if (status === "Cancelled") return "ملغي";
  return status;
}

function toMillis(value: unknown) {
  try {
    if (value && typeof value === "object" && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") return (fn as () => Date)().getTime();
    }
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

function getTotal(order: OrderDoc) {
  return Math.max(0, Number(order.total || order.amount || 0));
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم غير محدد";
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function isActive(order: OrderDoc) {
  return !CLOSED_STATUSES.has(normalizeStatus(order.status));
}

function isRestaurantOpen(item: RestaurantDoc) {
  return item.active !== false && item.open !== false && item.isOpen !== false && item.status !== "مغلق";
}

function isDriverOnline(item: DriverDoc) {
  return item.online === true || item.isOnline === true || item.status === "متصل";
}

export default function FuseAdminPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantDoc[]>([]);
  const [menu, setMenu] = useState<MenuDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/fuse-admin";
      return;
    }
    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session || session.role !== "admin") return;
    const unsubs = [
      onSnapshot(query(collection(db, "orders")), (snapshot) => {
        const data = snapshot.docs.map((item) => ({ ...(item.data() as Omit<OrderDoc, "documentId">), documentId: item.id }));
        data.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setOrders(data);
        setLoading(false);
        setError("");
      }, (e) => { setError(e.message || "تعذر تحميل الطلبات"); setLoading(false); }),
      onSnapshot(query(collection(db, "drivers")), (snapshot) => setDrivers(snapshot.docs.map((item) => ({ ...(item.data() as Omit<DriverDoc, "documentId">), documentId: item.id }))), () => setDrivers([])),
      onSnapshot(query(collection(db, "restaurants")), (snapshot) => setRestaurants(snapshot.docs.map((item) => ({ ...(item.data() as Omit<RestaurantDoc, "documentId">), documentId: item.id }))), () => setRestaurants([])),
      onSnapshot(query(collection(db, "menu")), (snapshot) => setMenu(snapshot.docs.map((item) => ({ ...(item.data() as Omit<MenuDoc, "documentId">), documentId: item.id }))), () => setMenu([])),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [session]);

  const stats = useMemo(() => {
    const count = (status: string) => orders.filter((order) => normalizeStatus(order.status) === status).length;
    const delivered = orders.filter((order) => normalizeStatus(order.status) === "تم التسليم");
    const active = orders.filter(isActive);
    const assignedReady = orders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل" && Boolean(order.driverName || order.assignedDriverName));
    const unassignedReady = orders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل" && !order.driverName && !order.assignedDriverName);
    return {
      active: active.length,
      new: count("جديد"),
      preparing: count("قيد التحضير"),
      ready: count("جاهز للتوصيل"),
      delivering: count("قيد التوصيل"),
      delivered: delivered.length,
      rejected: count("مرفوض"),
      cancelled: count("ملغي") + count("ملغى"),
      grossSales: delivered.reduce((sum, order) => sum + getTotal(order), 0),
      assignedReady: assignedReady.length,
      unassignedReady: unassignedReady.length,
    };
  }, [orders]);

  const restaurantStats = useMemo(() => {
    const map = new Map<string, { orders: number; active: number; sales: number }>();
    for (const order of orders) {
      const name = getRestaurant(order);
      const current = map.get(name) || { orders: 0, active: 0, sales: 0 };
      map.set(name, {
        orders: current.orders + 1,
        active: current.active + (isActive(order) ? 1 : 0),
        sales: current.sales + (normalizeStatus(order.status) === "تم التسليم" ? getTotal(order) : 0),
      });
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, ...value })).sort((a, b) => b.active - a.active || b.sales - a.sales).slice(0, 8);
  }, [orders]);

  const latestOrders = orders.slice(0, 12);
  const onlineDrivers = drivers.filter(isDriverOnline).length;
  const openRestaurants = restaurants.filter(isRestaurantOpen).length;
  const availableMenu = menu.filter((item) => item.available !== false && item.isAvailable !== false).length;

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div><small>FUSE Iraq</small><h1>لوحة الإدارة</h1><p>{session?.name || session?.email || "الإدارة"}</p></div>
          <nav>
            <Link href="/">الرئيسية</Link><Link href="/live-orders">الطلبات</Link><Link href="/restaurant-admin">المطاعم</Link><Link href="/auto-dispatch">التوزيع</Link><Link href="/drivers-admin">السائقون</Link>
          </nav>
        </header>

        {error ? <div className="alert">{error}</div> : null}

        <section className="hero">
          <div><span>مركز التشغيل</span><h2>كل حركة التطبيق<br />بأرقام حقيقية</h2><p>المبيعات هنا هي إجمالي الطلبات المسلّمة فقط، وليست أرباح FUSE أو العمولة.</p></div>
          <article><small>إجمالي المبيعات المسلّمة</small><b>{money(stats.grossSales)}</b></article>
        </section>

        <section className="stats">
          <article><span>نشطة</span><b>{stats.active}</b><small>جديدة {stats.new}</small></article>
          <article><span>قيد التحضير</span><b>{stats.preparing}</b><small>داخل المطاعم</small></article>
          <article><span>جاهزة بلا سائق</span><b>{stats.unassignedReady}</b><small>تحتاج توزيع</small></article>
          <article><span>جاهزة ومخصصة</span><b>{stats.assignedReady}</b><small>بانتظار استلام السائق</small></article>
          <article><span>قيد التوصيل</span><b>{stats.delivering}</b><small>مع السائقين</small></article>
          <article><span>مسلّمة</span><b>{stats.delivered}</b><small>مرفوضة {stats.rejected} · ملغاة {stats.cancelled}</small></article>
        </section>

        <section className="system">
          <article><span>المطاعم المفتوحة</span><b>{openRestaurants}/{restaurants.length}</b></article>
          <article><span>السائقون المتصلون</span><b>{onlineDrivers}/{drivers.length}</b></article>
          <article><span>الأصناف المتاحة</span><b>{availableMenu}/{menu.length}</b></article>
          <Link href="/reels-review"><span>مراجعة الريلز</span><b>فتح ←</b></Link>
          <Link href="/system-tools"><span>أدوات النظام</span><b>فتح ←</b></Link>
        </section>

        <section className="layout">
          <section className="panel">
            <div className="head"><h2>أحدث الطلبات</h2><Link href="/live-orders">عرض الكل</Link></div>
            {loading ? <div className="empty">جاري التحميل...</div> : latestOrders.length ? latestOrders.map((order) => (
              <article className="order" key={order.documentId}>
                <div><strong>{order.orderId || order.documentId}</strong><span>{getCustomer(order)} · {getRestaurant(order)}</span></div>
                <b>{money(getTotal(order))}</b>
                <em>{normalizeStatus(order.status)}</em>
              </article>
            )) : <div className="empty">ماكو طلبات حالياً.</div>}
          </section>

          <aside className="panel">
            <div className="head"><h2>أداء المطاعم</h2><Link href="/restaurant-admin">الإدارة</Link></div>
            {restaurantStats.length ? restaurantStats.map((item) => (
              <article className="restaurant" key={item.name}>
                <div><strong>{item.name}</strong><span>{item.orders} طلب · {item.active} نشط</span></div>
                <b>{money(item.sales)}</b>
              </article>
            )) : <div className="empty">ماكو بيانات مطاعم بعد.</div>}
          </aside>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.15),transparent 30%),#050505;color:#fff;padding:22px 14px;font-family:Arial,sans-serif}.shell{max-width:1240px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px}.topbar small,.hero span{color:#ff7a00;font-weight:900}.topbar h1{margin:4px 0;font-size:34px}.topbar p{margin:0;color:#aaa}.topbar nav{display:flex;gap:8px;flex-wrap:wrap}.topbar a,.head a{color:#fff;text-decoration:none;background:#171717;border:1px solid #333;border-radius:14px;padding:10px 13px;font-weight:900}.alert{background:#401313;color:#ffaaaa;border-radius:16px;padding:13px;margin-bottom:14px}.hero{display:grid;grid-template-columns:1fr minmax(250px,.45fr);gap:14px;background:linear-gradient(135deg,#171717,#33261c);border:1px solid #38322e;border-radius:30px;padding:22px;margin-bottom:14px}.hero h2{font-size:40px;margin:8px 0}.hero p{color:#ccc;line-height:1.7}.hero article{background:rgba(255,255,255,.07);border-radius:24px;padding:20px;display:grid;align-content:center;gap:10px}.hero article b{font-size:34px;color:#ff9b43}.stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px}.stats article,.system article,.system a{background:#121212;border:1px solid #292929;border-radius:22px;padding:16px;display:grid;gap:7px;color:#fff;text-decoration:none}.stats span,.system span{color:#aaa;font-size:12px;font-weight:800}.stats b,.system b{font-size:27px}.stats small{color:#888}.system{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}.layout{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.panel{background:#111;border:1px solid #2c2c2c;border-radius:28px;padding:17px}.head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.head h2{margin:0}.order{display:grid;grid-template-columns:1fr auto 130px;gap:12px;align-items:center;border-top:1px solid #292929;padding:13px 0}.order:first-of-type{border-top:0}.order div,.restaurant div{display:grid;gap:5px}.order span,.restaurant span{color:#999;font-size:12px}.order em{font-style:normal;text-align:center;background:#2a211a;color:#ffb067;padding:9px;border-radius:12px;font-size:12px;font-weight:900}.restaurant{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #292929;padding:14px 0}.restaurant:first-of-type{border-top:0}.restaurant>b{color:#ff9b43}.empty{text-align:center;color:#999;padding:28px}@media(max-width:900px){.stats{grid-template-columns:repeat(3,1fr)}.system{grid-template-columns:repeat(2,1fr)}.layout{grid-template-columns:1fr}}@media(max-width:600px){.page{padding:12px 8px}.topbar{align-items:flex-start}.hero{grid-template-columns:1fr}.hero h2{font-size:31px}.stats{grid-template-columns:repeat(2,1fr)}.system{grid-template-columns:1fr}.order{grid-template-columns:1fr}.order em{text-align:right}.panel{border-radius:22px;padding:14px}}
      `}</style>
    </main>
  );
}
