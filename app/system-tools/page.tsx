"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

type Restaurant = {
  docId: string;
  name?: string;
  open?: boolean;
  active?: boolean;
  createdAt?: unknown;
};

type Driver = {
  docId: string;
  name?: string;
  phone?: string;
  online?: boolean;
  active?: boolean;
  currentOrderId?: string;
  createdAt?: unknown;
};

type MenuItem = {
  docId: string;
  name?: string;
  restaurant?: string;
  restaurantName?: string;
  category?: string;
  active?: boolean;
  available?: boolean;
  isAvailable?: boolean;
  createdAt?: unknown;
};

type LiveOrder = {
  docId: string;
  restaurant?: string;
  restaurantName?: string;
  driverDocId?: string;
  driverId?: string;
  driverName?: string;
  assignedDriverName?: string;
  status?: string;
  total?: number;
  amount?: number;
  createdAt?: unknown;
};

function clean(value?: string) {
  return String(value || "").trim();
}

function norm(value?: string) {
  return clean(value).toLowerCase();
}

function formatDate(value: unknown) {
  if (!value) return "بدون وقت";

  try {
    const date =
      typeof (value as { toDate?: unknown })?.toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : value instanceof Date
          ? value
          : new Date(value as string | number);

    if (Number.isNaN(date.getTime())) return "بدون وقت";

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

function createdMs(value: unknown) {
  try {
    if (typeof (value as { toDate?: unknown })?.toDate === "function") {
      return (value as { toDate: () => Date }).toDate().getTime();
    }

    return new Date((value as string | number) || 0).getTime();
  } catch {
    return 0;
  }
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();

  items.forEach((item) => {
    const k = key(item);
    if (!k) return;

    const list = map.get(k) || [];
    list.push(item);
    map.set(k, list);
  });

  return Array.from(map.entries())
    .map(([name, list]) => ({ name, list }))
    .filter((group) => group.list.length > 1);
}

function restaurantName(item: Restaurant | MenuItem | LiveOrder) {
  if ("restaurantName" in item || "restaurant" in item) {
    return clean(
      ("restaurantName" in item ? item.restaurantName : "") ||
        ("restaurant" in item ? item.restaurant : "")
    );
  }

  if ("name" in item) {
    return clean(item.name);
  }

  return "";
}

function orderStatus(order: LiveOrder) {
  return clean(order.status || "جديد");
}

function orderTotal(order: LiveOrder) {
  return Number(order.total || order.amount || 0);
}

function isMenuActive(item: MenuItem) {
  return item.active !== false && item.available !== false && item.isAvailable !== false;
}

function isOrderActive(order: LiveOrder) {
  return !["تم التسليم", "مرفوض", "ملغي", "Cancelled", "Delivered"].includes(
    String(order.status || "")
  );
}

function Icon({ name }: { name: string }) {
  const p = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "tools") {
    return (
      <svg {...p}>
        <path d="M14.7 6.3a4 4 0 105.6 5.6l-7.7 7.7a2 2 0 01-2.8 0l-1.4-1.4a2 2 0 010-2.8l7.7-7.7z" />
        <path d="M6 14l-3 3 4 4 3-3" />
      </svg>
    );
  }

  if (name === "database") {
    return (
      <svg {...p}>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...p}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...p}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...p}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function SystemToolsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [working, setWorking] = useState("");
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  }

  useEffect(() => {
    const q = query(collection(db, "restaurants"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setRestaurants(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<Restaurant, "docId">),
            docId: item.id,
          }))
        );
      },
      () => showToast("صار خطأ بقراءة المطاعم")
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "drivers"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setDrivers(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<Driver, "docId">),
            docId: item.id,
          }))
        );
      },
      () => showToast("صار خطأ بقراءة السائقين")
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "menu"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMenu(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<MenuItem, "docId">),
            docId: item.id,
          }))
        );
      },
      () => showToast("صار خطأ بقراءة المنيو")
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setOrders(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<LiveOrder, "docId">),
            docId: item.id,
          }))
        );
      },
      () => showToast("صار خطأ بقراءة الطلبات")
    );

    return () => unsub();
  }, []);

  const restaurantDuplicates = useMemo(() => {
    return groupBy(restaurants, (item) => norm(item.name));
  }, [restaurants]);

  const driverDuplicates = useMemo(() => {
    return groupBy(drivers, (item) => norm(item.phone) || norm(item.name));
  }, [drivers]);

  const menuDuplicates = useMemo(() => {
    return groupBy(
      menu,
      (item) => `${norm(item.restaurant || item.restaurantName)}__${norm(item.category)}__${norm(item.name)}`
    );
  }, [menu]);

  const brokenMenu = useMemo(() => {
    return menu.filter((item) => {
      const name = norm(restaurantName(item));
      if (!name) return true;

      return !restaurants.some((restaurant) => norm(restaurantName(restaurant)) === name);
    });
  }, [menu, restaurants]);

  const ordersWithoutDriver = useMemo(() => {
    return orders.filter((order) => {
      const status = orderStatus(order);

      return (
        status === "قيد التوصيل" &&
        !order.driverDocId &&
        !order.driverId &&
        !order.driverName &&
        !order.assignedDriverName
      );
    });
  }, [orders]);

  const activeOrders = useMemo(() => orders.filter(isOrderActive), [orders]);

  const revenue = useMemo(() => {
    return orders
      .filter((order) => ["تم التسليم", "Delivered"].includes(String(order.status || "")))
      .reduce((sum, order) => sum + orderTotal(order), 0);
  }, [orders]);

  const healthScore = useMemo(() => {
    const issues =
      restaurantDuplicates.length +
      driverDuplicates.length +
      menuDuplicates.length +
      brokenMenu.length +
      ordersWithoutDriver.length;

    if (issues === 0) return 100;
    return Math.max(20, 100 - issues * 12);
  }, [
    brokenMenu.length,
    driverDuplicates.length,
    menuDuplicates.length,
    ordersWithoutDriver.length,
    restaurantDuplicates.length,
  ]);

  function pickKeepRestaurant(list: Restaurant[]) {
    return [...list].sort((a, b) => {
      const aOpen = a.active !== false && a.open !== false ? 1 : 0;
      const bOpen = b.active !== false && b.open !== false ? 1 : 0;

      if (aOpen !== bOpen) return bOpen - aOpen;

      return createdMs(b.createdAt) - createdMs(a.createdAt);
    })[0];
  }

  function pickKeepDriver(list: Driver[]) {
    return [...list].sort((a, b) => {
      const aOnline = a.active !== false && a.online ? 1 : 0;
      const bOnline = b.active !== false && b.online ? 1 : 0;

      if (aOnline !== bOnline) return bOnline - aOnline;

      return createdMs(b.createdAt) - createdMs(a.createdAt);
    })[0];
  }

  function pickKeepMenu(list: MenuItem[]) {
    return [...list].sort((a, b) => {
      const aActive = isMenuActive(a) ? 1 : 0;
      const bActive = isMenuActive(b) ? 1 : 0;

      if (aActive !== bActive) return bActive - aActive;

      return createdMs(b.createdAt) - createdMs(a.createdAt);
    })[0];
  }

  async function cleanupRestaurants() {
    const sure = window.confirm(
      "متأكد تريد حذف المطاعم المكررة؟ راح نخلي نسخة وحدة من كل اسم."
    );
    if (!sure) return;

    setWorking("restaurants");

    try {
      for (const group of restaurantDuplicates) {
        const keep = pickKeepRestaurant(group.list);
        const remove = group.list.filter((item) => item.docId !== keep.docId);

        await Promise.all(
          remove.map((item) => deleteDoc(doc(db, "restaurants", item.docId)))
        );
      }

      showToast("تم تنظيف المطاعم المكررة");
    } catch {
      showToast("صار خطأ بتنظيف المطاعم");
    } finally {
      setWorking("");
    }
  }

  async function cleanupDrivers() {
    const sure = window.confirm(
      "متأكد تريد حذف السائقين المكررين؟ راح نخلي نسخة وحدة."
    );
    if (!sure) return;

    setWorking("drivers");

    try {
      for (const group of driverDuplicates) {
        const keep = pickKeepDriver(group.list);
        const remove = group.list.filter((item) => item.docId !== keep.docId);

        await Promise.all(remove.map((item) => deleteDoc(doc(db, "drivers", item.docId))));
      }

      showToast("تم تنظيف السائقين المكررين");
    } catch {
      showToast("صار خطأ بتنظيف السائقين");
    } finally {
      setWorking("");
    }
  }

  async function cleanupMenu() {
    const sure = window.confirm(
      "متأكد تريد حذف الأصناف المكررة؟ راح نخلي نسخة وحدة لكل صنف بنفس المطعم."
    );
    if (!sure) return;

    setWorking("menu");

    try {
      for (const group of menuDuplicates) {
        const keep = pickKeepMenu(group.list);
        const remove = group.list.filter((item) => item.docId !== keep.docId);

        await Promise.all(remove.map((item) => deleteDoc(doc(db, "menu", item.docId))));
      }

      showToast("تم تنظيف المنيو المكرر");
    } catch {
      showToast("صار خطأ بتنظيف المنيو");
    } finally {
      setWorking("");
    }
  }

  async function disableBrokenMenu() {
    const sure = window.confirm(
      "تعطيل الأصناف المرتبطة بمطاعم غير موجودة؟ ما راح نحذفها، بس نخليها غير فعالة."
    );
    if (!sure) return;

    setWorking("broken-menu");

    try {
      await Promise.all(
        brokenMenu.map((item) =>
          updateDoc(doc(db, "menu", item.docId), {
            active: false,
            available: false,
            isAvailable: false,
            updatedAt: Date.now(),
          })
        )
      );

      showToast("تم تعطيل الأصناف غير المرتبطة بمطعم");
    } catch {
      showToast("صار خطأ بتعطيل الأصناف");
    } finally {
      setWorking("");
    }
  }

  return (
    <main dir="rtl" className="tools-page">
      {toast ? <div className="toast">{toast}</div> : null}

      <section className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">
              <Icon name="tools" />
            </div>
            <div>
              <h1>FUSE Command Tools</h1>
              <p>تنظيف Firestore وفحص سلامة التشغيل</p>
            </div>
          </div>

          <nav className="nav">
            <Link href="/" className="nav-link">الرئيسية</Link>
            <Link href="/restaurant-admin" className="nav-link">المطعم</Link>
            <Link href="/driver-app" className="nav-link">السائق</Link>
            <Link href="/live-orders" className="nav-link">الطلبات</Link>
            <Link href="/system-tools" className="nav-link main">أدوات النظام</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <span className="kicker">🧹 مركز تنظيف الداتا</span>
            <h2>
              إدارة صحة <span>نظام FUSE</span>
            </h2>
            <p>
              فحص التكرارات، تعطيل الأصناف المكسورة، متابعة الطلبات النشطة، وتنظيف
              البيانات التجريبية بدون أي حذف تلقائي.
            </p>

            <div className="stats">
              <Stat title="مطاعم" value={restaurants.length} />
              <Stat title="أصناف منيو" value={menu.length} />
              <Stat title="سائقين" value={drivers.length} />
              <Stat title="طلبات" value={orders.length} />
            </div>
          </div>

          <aside className="side-card">
            <div className="score-ring">
              <strong>{healthScore}%</strong>
              <span>System Health</span>
            </div>

            <div className="health">
              <Health title="مطاعم مكررة" value={restaurantDuplicates.length} danger={restaurantDuplicates.length > 0} />
              <Health title="سائقين مكررين" value={driverDuplicates.length} danger={driverDuplicates.length > 0} />
              <Health title="أصناف مكررة" value={menuDuplicates.length} danger={menuDuplicates.length > 0} />
              <Health title="منيو بدون مطعم" value={brokenMenu.length} danger={brokenMenu.length > 0} />
              <Health title="طلبات بالطريق بدون سائق" value={ordersWithoutDriver.length} danger={ordersWithoutDriver.length > 0} />
            </div>
          </aside>
        </section>

        <section className="quick-row">
          <QuickCard title="طلبات نشطة" value={activeOrders.length} hint="غير مكتملة" icon="orders" />
          <QuickCard title="إيراد مكتمل" value={`${revenue.toLocaleString()} د.ع`} hint="من الطلبات المسلمة" icon="database" />
          <QuickCard title="مشاكل الداتا" value={100 - healthScore} hint="كلما قل أفضل" icon="alert" />
          <QuickCard title="آخر تحديث" value="Live" hint={formatDate(new Date())} icon="check" />
        </section>

        <section className="layout">
          <div className="panel">
            <div className="panel-head">
              <div>
                <span>Cleanup Actions</span>
                <h2>أدوات التنظيف</h2>
              </div>
            </div>

            <div className="tools-grid">
              <ToolCard
                title="تنظيف المطاعم المكررة"
                desc="يحذف النسخ المكررة من نفس اسم المطعم ويخلي نسخة واحدة، ويفضل المفتوحة والفعالة."
                count={restaurantDuplicates.length}
                onClick={cleanupRestaurants}
                disabled={restaurantDuplicates.length === 0 || working === "restaurants"}
                working={working === "restaurants"}
              />

              <ToolCard
                title="تنظيف السائقين المكررين"
                desc="يحذف السائقين المكررين حسب الرقم أو الاسم، ويخلي السائق المتصل أو الأحدث."
                count={driverDuplicates.length}
                onClick={cleanupDrivers}
                disabled={driverDuplicates.length === 0 || working === "drivers"}
                working={working === "drivers"}
              />

              <ToolCard
                title="تنظيف المنيو المكرر"
                desc="يحذف الأصناف المكررة بنفس الاسم ونفس المطعم ونفس التصنيف، ويخلي نسخة واحدة."
                count={menuDuplicates.length}
                onClick={cleanupMenu}
                disabled={menuDuplicates.length === 0 || working === "menu"}
                working={working === "menu"}
              />

              <ToolCard
                title="تعطيل منيو بدون مطعم"
                desc="أي صنف مربوط بمطعم غير موجود يتم تعطيله فقط بدون حذف."
                count={brokenMenu.length}
                onClick={disableBrokenMenu}
                disabled={brokenMenu.length === 0 || working === "broken-menu"}
                working={working === "broken-menu"}
              />
            </div>
          </div>

          <aside className="panel">
            <div className="panel-head">
              <div>
                <span>Live Diagnostics</span>
                <h2>ملخص الفحص</h2>
              </div>
            </div>

            <div className="list">
              <Info
                title="آخر حالة تشغيل"
                value={
                  activeOrders.length > 0
                    ? `عدك ${activeOrders.length} طلب نشط`
                    : "ماكو طلبات نشطة حالياً"
                }
              />

              <Info
                title="أسماء المطاعم المكررة"
                value={
                  restaurantDuplicates.length > 0
                    ? restaurantDuplicates
                        .slice(0, 6)
                        .map((group) => `${group.name} ×${group.list.length}`)
                        .join(" · ")
                    : "ماكو تكرار"
                }
              />

              <Info
                title="أسماء السائقين/الأرقام المكررة"
                value={
                  driverDuplicates.length > 0
                    ? driverDuplicates
                        .slice(0, 6)
                        .map((group) => `${group.name} ×${group.list.length}`)
                        .join(" · ")
                    : "ماكو تكرار"
                }
              />

              <Info
                title="أصناف منيو مكسورة"
                value={
                  brokenMenu.length > 0
                    ? brokenMenu
                        .slice(0, 6)
                        .map((item) => `${item.name || "صنف"} / ${restaurantName(item) || "بدون مطعم"}`)
                        .join(" · ")
                    : "كل الأصناف مربوطة بمطاعم"
                }
              />
            </div>
          </aside>
        </section>
      </section>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html),
        :global(body) {
          margin: 0;
          padding: 0;
          background: #050505;
        }

        .tools-page {
          min-height: 100vh;
          color: white;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 122, 0, 0.18), transparent 32%),
            radial-gradient(circle at 88% 16%, rgba(239, 68, 68, 0.1), transparent 28%),
            radial-gradient(circle at 50% 96%, rgba(56, 189, 248, 0.08), transparent 34%),
            linear-gradient(135deg, #050505, #0d0d10 55%, #050505);
          font-family: Cairo, system-ui, sans-serif;
        }

        .shell {
          width: min(1600px, calc(100% - 36px));
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .topbar,
        .hero-card,
        .side-card,
        .quick-card,
        .panel {
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(12, 12, 14, 0.78);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(18px);
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 30px;
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
          box-shadow: 0 16px 45px rgba(255, 122, 0, 0.26);
        }

        .brand h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
        }

        .brand p {
          margin: 5px 0 0;
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          font-weight: 850;
        }

        .nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .nav-link {
          text-decoration: none;
          border-radius: 999px;
          padding: 12px 16px;
          color: white;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 1000;
          font-size: 13px;
        }

        .nav-link.main {
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
        .side-card,
        .panel {
          border-radius: 36px;
          padding: 28px;
        }

        .hero-card {
          background:
            linear-gradient(135deg, rgba(255, 122, 0, 0.15), transparent 48%),
            rgba(12, 12, 14, 0.82);
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

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 25px;
        }

        .stat {
          border-radius: 24px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .stat strong {
          display: block;
          font-size: 25px;
          font-weight: 1000;
        }

        .stat small {
          display: block;
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 900;
        }

        .score-ring {
          min-height: 180px;
          border-radius: 32px;
          display: grid;
          place-items: center;
          text-align: center;
          background:
            radial-gradient(circle, rgba(255,122,0,0.22), transparent 62%),
            rgba(0,0,0,0.28);
          border: 1px solid rgba(255,122,0,0.22);
          margin-bottom: 16px;
        }

        .score-ring strong {
          display: block;
          font-size: 52px;
          font-weight: 1000;
          color: #ffb86b;
        }

        .score-ring span {
          display: block;
          margin-top: 6px;
          color: rgba(255,255,255,0.48);
          font-weight: 900;
        }

        .health {
          display: grid;
          gap: 12px;
        }

        .health-row,
        .info,
        .tool-card,
        .quick-card {
          border-radius: 22px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .health-row small,
        .info small,
        .quick-card small {
          display: block;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 900;
        }

        .health-row strong,
        .info strong {
          display: block;
          margin-top: 6px;
          font-weight: 1000;
          line-height: 1.7;
        }

        .quick-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .quick-card {
          min-height: 140px;
          background:
            linear-gradient(135deg, rgba(255,122,0,0.08), transparent),
            rgba(12,12,14,0.74);
        }

        .quick-card svg {
          color: #ff7a00;
          margin-bottom: 12px;
        }

        .quick-card b {
          display: block;
          margin: 8px 0 6px;
          font-size: 26px;
          line-height: 1.12;
          font-weight: 1000;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 18px;
          align-items: start;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 14px;
          margin-bottom: 16px;
        }

        .panel-head span {
          color: #ff7a00;
          font-size: 12px;
          font-weight: 1000;
        }

        .panel-head h2 {
          margin: 5px 0 0;
          font-size: 30px;
          font-weight: 1000;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .tool-card {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.075),
            rgba(255, 255, 255, 0.025)
          );
        }

        .tool-card h3 {
          margin: 0;
          font-size: 21px;
          font-weight: 1000;
        }

        .tool-card p {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.9;
          font-weight: 850;
        }

        .danger {
          color: #f87171;
        }

        .ok {
          color: #22c55e;
        }

        .btn {
          width: 100%;
          margin-top: 14px;
          border: 0;
          border-radius: 20px;
          padding: 15px;
          color: #050505;
          background: linear-gradient(135deg, #ff7a00, #ffc266);
          font-weight: 1000;
          cursor: pointer;
        }

        .btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .list {
          display: grid;
          gap: 12px;
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

        @media (max-width: 1180px) {
          .hero,
          .layout,
          .quick-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .shell {
            width: min(100% - 24px, 1600px);
            padding-top: 12px;
          }

          .topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .stats,
          .tools-grid {
            grid-template-columns: 1fr;
          }

          .hero-card,
          .side-card,
          .panel {
            padding: 18px;
            border-radius: 28px;
          }

          .nav {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }

          .nav-link {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <small>{title}</small>
    </div>
  );
}

function QuickCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: string;
}) {
  return (
    <article className="quick-card">
      <Icon name={icon} />
      <small>{title}</small>
      <b>{value}</b>
      <small>{hint}</small>
    </article>
  );
}

function Health({
  title,
  value,
  danger,
}: {
  title: string;
  value: number;
  danger: boolean;
}) {
  return (
    <div className="health-row">
      <small>{title}</small>
      <strong className={danger ? "danger" : "ok"}>
        {danger ? `${value} يحتاج تنظيف` : "سليم"}
      </strong>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="info">
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function ToolCard({
  title,
  desc,
  count,
  onClick,
  disabled,
  working,
}: {
  title: string;
  desc: string;
  count: number;
  onClick: () => void;
  disabled: boolean;
  working: boolean;
}) {
  return (
    <article className="tool-card">
      <h3>{title}</h3>
      <p>{desc}</p>
      <p>
        العدد:{" "}
        <strong className={count > 0 ? "danger" : "ok"}>
          {count > 0 ? count : "سليم"}
        </strong>
      </p>

      <button onClick={onClick} disabled={disabled} className="btn">
        {working ? "جاري التنفيذ..." : count > 0 ? "تنظيف الآن" : "لا يحتاج تنظيف"}
      </button>
    </article>
  );
}