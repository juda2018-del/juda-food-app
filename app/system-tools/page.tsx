 "use client";

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
  createdAt?: any;
};

type Driver = {
  docId: string;
  name?: string;
  phone?: string;
  online?: boolean;
  active?: boolean;
  currentOrderId?: string;
  createdAt?: any;
};

type MenuItem = {
  docId: string;
  name?: string;
  restaurant?: string;
  category?: string;
  active?: boolean;
  createdAt?: any;
};

type LiveOrder = {
  docId: string;
  restaurant?: string;
  driverDocId?: string;
  driverName?: string;
  status?: string;
  createdAt?: any;
};

function clean(value?: string) {
  return String(value || "").trim();
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

function createdMs(value: any) {
  try {
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    return new Date(value || 0).getTime();
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

export default function SystemToolsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [working, setWorking] = useState("");
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 3500);
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
      () => {
        showToast("صار خطأ بقراءة المطاعم");
      }
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
      () => {
        showToast("صار خطأ بقراءة السائقين");
      }
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
      () => {
        showToast("صار خطأ بقراءة المنيو");
      }
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
      () => {
        showToast("صار خطأ بقراءة الطلبات");
      }
    );

    return () => unsub();
  }, []);

  const restaurantDuplicates = useMemo(() => {
    return groupBy(restaurants, (item) => clean(item.name));
  }, [restaurants]);

  const driverDuplicates = useMemo(() => {
    return groupBy(drivers, (item) => clean(item.phone) || clean(item.name));
  }, [drivers]);

  const menuDuplicates = useMemo(() => {
    return groupBy(
      menu,
      (item) =>
        `${clean(item.restaurant)}__${clean(item.category)}__${clean(item.name)}`
    );
  }, [menu]);

  const brokenMenu = useMemo(() => {
    return menu.filter((item) => {
      const restaurantName = clean(item.restaurant);
      if (!restaurantName) return true;

      return !restaurants.some(
        (restaurant) => clean(restaurant.name) === restaurantName
      );
    });
  }, [menu, restaurants]);

  const ordersWithoutDriver = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === "قيد التوصيل" && !order.driverDocId && !order.driverName
    );
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(String(order.status || ""))
    );
  }, [orders]);

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
      const aActive = a.active !== false ? 1 : 0;
      const bActive = b.active !== false ? 1 : 0;

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

        await Promise.all(
          remove.map((item) => deleteDoc(doc(db, "drivers", item.docId)))
        );
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

        await Promise.all(
          remove.map((item) => deleteDoc(doc(db, "menu", item.docId)))
        );
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
      <style jsx global>{`
        body {
          margin: 0;
          background: #050505;
        }

        * {
          box-sizing: border-box;
        }

        .tools-page {
          min-height: 100vh;
          color: white;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 122, 0, 0.18), transparent 32%),
            radial-gradient(circle at 88% 16%, rgba(239, 68, 68, 0.1), transparent 28%),
            radial-gradient(circle at 50% 96%, rgba(56, 189, 248, 0.08), transparent 34%),
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
          width: min(1600px, calc(100% - 36px));
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
        .side-card,
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

        .stats {
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

        .side-card h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 1000;
        }

        .health {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .health-row {
          border-radius: 22px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .health-row small {
          display: block;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 900;
        }

        .health-row strong {
          display: block;
          margin-top: 6px;
          font-weight: 1000;
          line-height: 1.7;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 430px;
          gap: 18px;
          align-items: start;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .tool-card {
          border-radius: 30px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
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
          color: #ef4444;
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

        .item {
          border-radius: 22px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .item small {
          display: block;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 900;
        }

        .item strong {
          display: block;
          margin-top: 6px;
          font-weight: 1000;
          line-height: 1.7;
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
          .layout {
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
          }
        }
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">F</div>
            <div>
              <h1>أدوات نظام FUSE</h1>
              <p>تنظيف التكرارات وفحص سلامة بيانات Firestore</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">الرئيسية</a>
            <a href="/restaurants-admin">المطاعم</a>
            <a href="/menu-live">المنيو</a>
            <a href="/drivers-admin">السائقين</a>
            <a href="/notification-center">التنبيهات</a>
            <a className="main" href="/system-tools">
              أدوات النظام
            </a>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-card">
            <div className="kicker">🧹 مركز تنظيف Firestore</div>

            <h2>
              صفحة تنظيف <span>الداتا التجريبية</span>
            </h2>

            <p>
              هاي الصفحة تحل مشكلة التكرارات مثل تكرار خان قدوري أو تكرار
              السائقين أو أصناف المنيو. ما تحذف شي تلقائياً، كل حذف لازم تضغط
              زر وتوافق.
            </p>

            <div className="stats">
              <div className="mini">
                <strong>{restaurants.length}</strong>
                <small>مطاعم</small>
              </div>

              <div className="mini">
                <strong>{menu.length}</strong>
                <small>أصناف منيو</small>
              </div>

              <div className="mini">
                <strong>{drivers.length}</strong>
                <small>سائقين</small>
              </div>

              <div className="mini">
                <strong>{orders.length}</strong>
                <small>طلبات</small>
              </div>
            </div>
          </div>

          <aside className="side-card">
            <h3>فحص الصحة</h3>

            <div className="health">
              <Health
                title="مطاعم مكررة"
                value={restaurantDuplicates.length}
                danger={restaurantDuplicates.length > 0}
              />

              <Health
                title="سائقين مكررين"
                value={driverDuplicates.length}
                danger={driverDuplicates.length > 0}
              />

              <Health
                title="أصناف مكررة"
                value={menuDuplicates.length}
                danger={menuDuplicates.length > 0}
              />

              <Health
                title="منيو بدون مطعم"
                value={brokenMenu.length}
                danger={brokenMenu.length > 0}
              />

              <Health
                title="طلبات بالطريق بدون سائق"
                value={ordersWithoutDriver.length}
                danger={ordersWithoutDriver.length > 0}
              />
            </div>
          </aside>
        </section>

        <section className="layout">
          <div className="panel">
            <div className="tools-grid">
              <ToolCard
                title="تنظيف المطاعم المكررة"
                desc="يحذف النسخ المكررة من نفس اسم المطعم ويخلي نسخة واحدة، ويفضل المفتوحة والفعالة."
                count={restaurantDuplicates.length}
                onClick={cleanupRestaurants}
                disabled={
                  restaurantDuplicates.length === 0 || working === "restaurants"
                }
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
            <div className="list">
              <div className="item">
                <small>آخر حالة تشغيل</small>
                <strong>
                  {activeOrders.length > 0
                    ? `عدك ${activeOrders.length} طلب نشط`
                    : "ماكو طلبات نشطة حالياً"}
                </strong>
              </div>

              <div className="item">
                <small>أسماء المطاعم المكررة</small>
                <strong>
                  {restaurantDuplicates.length > 0
                    ? restaurantDuplicates
                        .slice(0, 6)
                        .map((group) => `${group.name} ×${group.list.length}`)
                        .join(" · ")
                    : "ماكو تكرار"}
                </strong>
              </div>

              <div className="item">
                <small>أسماء السائقين/الأرقام المكررة</small>
                <strong>
                  {driverDuplicates.length > 0
                    ? driverDuplicates
                        .slice(0, 6)
                        .map((group) => `${group.name} ×${group.list.length}`)
                        .join(" · ")
                    : "ماكو تكرار"}
                </strong>
              </div>

              <div className="item">
                <small>أصناف منيو مكسورة</small>
                <strong>
                  {brokenMenu.length > 0
                    ? brokenMenu
                        .slice(0, 6)
                        .map(
                          (item) =>
                            `${item.name || "صنف"} / ${
                              item.restaurant || "بدون مطعم"
                            }`
                        )
                        .join(" · ")
                    : "كل الأصناف مربوطة بمطاعم"}
                </strong>
              </div>

              <div className="item">
                <small>آخر تحديث</small>
                <strong>Live الآن</strong>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
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
        {working
          ? "جاري التنفيذ..."
          : count > 0
          ? "تنظيف الآن"
          : "لا يحتاج تنظيف"}
      </button>
    </article>
  );
}