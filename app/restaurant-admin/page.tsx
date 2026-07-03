"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const statusFlow = ["قيد التحضير", "جاهز للتوصيل", "تم التسليم", "مرفوض"];

function readSession(): FuseSession | null {
  try {
    const raw =
      localStorage.getItem(FUSE_LOCAL_SESSION) ||
      localStorage.getItem("FUSE_LOCAL_SESSION") ||
      localStorage.getItem("fuseUser");

    if (!raw) return null;

    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role || parsed.fuseRole);

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

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString()} د.ع`;
}

function getRestaurant(item: OrderDoc | MenuDoc) {
  return item.restaurant || item.restaurantName || "مطعم";
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

function sessionRestaurant(session: FuseSession | null) {
  return session?.restaurant || session?.restaurantName || session?.restaurantId || "";
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
    const ownRestaurant = sessionRestaurant(session);
    if (!ownRestaurant) return true;
    return restaurant === ownRestaurant;
  }

  return false;
}

function statusClass(status?: string) {
  const clean = normalizeStatus(status);

  if (clean === "جديد") return "orange";
  if (clean === "قيد التحضير") return "yellow";
  if (clean === "جاهز للتوصيل") return "sky";
  if (clean === "قيد التوصيل") return "purple";
  if (clean === "تم التسليم") return "green";
  if (clean === "مرفوض") return "red";

  return "muted";
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

  if (name === "orders") {
    return (
      <svg {...p}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg {...p}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...p}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
    );
  }

  if (name === "money") {
    return (
      <svg {...p}>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...p}>
        <path d="M18 9a6 6 0 10-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9z" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

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
      setError("ماكو جلسة دخول. ارجع لصفحة تسجيل الدخول.");
      return;
    }

    if (saved.role !== "admin" && saved.role !== "restaurant") {
      window.location.href = roleHome[saved.role] || "/login";
      return;
    }

    setSession(saved);

    if (saved.role === "restaurant" && sessionRestaurant(saved)) {
      setSelectedRestaurant(sessionRestaurant(saved));
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

    const result = Array.from(list).filter(Boolean).sort();

    if (result.length === 0 && sessionRestaurant(session)) {
      return [sessionRestaurant(session)];
    }

    return result;
  }, [menu, orders, session]);

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

  const counts = useMemo(() => {
    const delivered = visibleOrders.filter((order) => normalizeStatus(order.status) === "تم التسليم");
    const active = visibleOrders.filter((order) => {
      const status = normalizeStatus(order.status);
      return status !== "تم التسليم" && status !== "مرفوض";
    });

    return {
      all: visibleOrders.length,
      newOrders: visibleOrders.filter((order) => normalizeStatus(order.status) === "جديد").length,
      preparing: visibleOrders.filter((order) => normalizeStatus(order.status) === "قيد التحضير").length,
      ready: visibleOrders.filter((order) => normalizeStatus(order.status) === "جاهز للتوصيل").length,
      active: active.length,
      delivered: delivered.length,
      revenue: delivered.reduce((sum, order) => sum + getTotal(order), 0),
      availableMenu: visibleMenu.filter(menuAvailable).length,
    };
  }, [visibleMenu, visibleOrders]);

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
      role === "restaurant" && sessionRestaurant(session)
        ? sessionRestaurant(session)
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
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">F</div>
            <div>
              <b>FUSE Restaurant</b>
              <span>{session?.name || "لوحة تشغيل المطعم"}</span>
            </div>
          </div>

          <nav className="nav">
            <Link href="/" className="pill">الرئيسية</Link>
            <Link href="/restaurant-admin" className="pill active">لوحة المطعم</Link>
            <Link href="/live-orders" className="pill">الطلبات المباشرة</Link>
            <Link href="/notification-center" className="pill">الإشعارات</Link>
            <Link href="/reports" className="pill">التقارير</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <span>لوحة المطعم الاحترافية</span>
            <h1>
              إدارة الطلبات
              <br />
              <em>والمنيو مباشر</em>
            </h1>
            <p>
              تحكم سريع بحالات الطلب، متابعة الإيراد، إدارة الأصناف، وفلاتر تشغيلية
              مناسبة للمطعم والإدارة.
            </p>
          </div>

          <div className="hero-stats">
            <article>
              <Icon name="orders" />
              <span>طلبات نشطة</span>
              <b>{counts.active}</b>
              <small>جديدة: {counts.newOrders}</small>
            </article>

            <article>
              <Icon name="clock" />
              <span>قيد التحضير</span>
              <b>{counts.preparing}</b>
              <small>جاهزة: {counts.ready}</small>
            </article>

            <article>
              <Icon name="money" />
              <span>مبيعات مكتملة</span>
              <b>{formatIQD(counts.revenue)}</b>
              <small>{counts.delivered} طلب مكتمل</small>
            </article>

            <article>
              <Icon name="menu" />
              <span>أصناف متاحة</span>
              <b>{counts.availableMenu}</b>
              <small>من أصل {visibleMenu.length}</small>
            </article>
          </div>
        </section>

        <section className="controls">
          <label>
            <span>بحث سريع</span>
            <div className="input-wrap">
              <Icon name="search" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="زبون، هاتف، عنوان، سائق..."
              />
            </div>
          </label>

          <label>
            <span>المطعم</span>
            <select
              value={selectedRestaurant}
              onChange={(event) => setSelectedRestaurant(event.target.value)}
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

          <label>
            <span>الحالة</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {["الكل", ...statuses].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </section>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        <section className="layout">
          <section className="panel orders-panel">
            <div className="panel-head">
              <div>
                <span>Live Orders</span>
                <h2>طلبات المطعم</h2>
              </div>
              <b>{counts.all}</b>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="empty">
                <h3>ماكو طلبات مطابقة</h3>
                <p>إذا وصل طلب جديد راح يظهر هنا مباشرة.</p>
              </div>
            ) : (
              <div className="orders-list">
                {visibleOrders.slice(0, 60).map((order) => {
                  const status = normalizeStatus(order.status);

                  return (
                    <article key={order.documentId} className="order-card">
                      <div className="order-top">
                        <div>
                          <div className="order-title">
                            <h3>{getCustomer(order)}</h3>
                            <span className={`badge ${statusClass(status)}`}>{status}</span>
                          </div>
                          <p>
                            {getRestaurant(order)} — {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="total-box">
                          <span>المجموع</span>
                          <b>{formatIQD(getTotal(order))}</b>
                        </div>
                      </div>

                      <div className="info-grid">
                        <div>
                          <span>الهاتف</span>
                          <b dir="ltr">{getPhone(order) || "—"}</b>
                        </div>
                        <div>
                          <span>العنوان</span>
                          <b>{order.address || "بدون عنوان"}</b>
                        </div>
                        <div>
                          <span>السائق</span>
                          <b>{order.driverName || "غير محدد"}</b>
                        </div>
                      </div>

                      {order.items?.length ? (
                        <div className="items-box">
                          <span>تفاصيل الطلب</span>
                          <p>
                            {order.items
                              .map((item) => `${item.name || item.title || "صنف"} ×${item.qty || item.quantity || 1}`)
                              .join("، ")}
                          </p>
                        </div>
                      ) : null}

                      <div className="actions">
                        {statusFlow.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            disabled={savingOrderId === order.documentId}
                            onClick={() => updateOrderStatus(order, nextStatus)}
                            className={nextStatus === "مرفوض" ? "danger" : nextStatus === "جاهز للتوصيل" ? "primary" : ""}
                          >
                            {savingOrderId === order.documentId ? "..." : nextStatus}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="panel menu-panel">
            <div className="panel-head">
              <div>
                <span>Menu Control</span>
                <h2>المنيو</h2>
              </div>
              <b>{visibleMenu.length}</b>
            </div>

            <div className="menu-form">
              <input
                value={menuName}
                onChange={(event) => setMenuName(event.target.value)}
                placeholder="اسم الصنف"
              />
              <input
                value={menuPrice}
                onChange={(event) => setMenuPrice(event.target.value)}
                placeholder="السعر"
                dir="ltr"
              />
              <input
                value={menuCategory}
                onChange={(event) => setMenuCategory(event.target.value)}
                placeholder="القسم"
              />
              <button type="button" onClick={addMenuItem}>
                إضافة صنف
              </button>
            </div>

            <div className="menu-list">
              {visibleMenu.length === 0 ? (
                <div className="empty small">
                  <h3>ماكو أصناف حالياً</h3>
                  <p>أضف صنف جديد حتى يظهر هنا.</p>
                </div>
              ) : (
                visibleMenu.slice(0, 30).map((item) => (
                  <article key={item.documentId} className="menu-card">
                    <div className="menu-top">
                      <div>
                        <h3>{getMenuName(item)}</h3>
                        <p>{item.category || "عام"} — {getRestaurant(item)}</p>
                      </div>
                      <span className={`badge ${menuAvailable(item) ? "green" : "red"}`}>
                        {menuAvailable(item) ? "متاح" : "متوقف"}
                      </span>
                    </div>

                    <b className="price">{formatIQD(Number(item.price || 0))}</b>

                    <button
                      type="button"
                      disabled={savingMenuId === item.documentId}
                      onClick={() => toggleMenu(item)}
                      className={menuAvailable(item) ? "danger" : "primary"}
                    >
                      {savingMenuId === item.documentId
                        ? "جاري..."
                        : menuAvailable(item)
                          ? "إيقاف الصنف"
                          : "تفعيل الصنف"}
                    </button>
                  </article>
                ))
              )}
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

        .page {
          min-height: 100vh;
          padding: 26px 16px;
          color: #fff;
          font-family: Cairo, system-ui, sans-serif;
          background:
            radial-gradient(circle at top right, rgba(255,122,0,0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(255,61,0,0.11), transparent 34%),
            #050505;
        }

        .shell {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        .topbar,
        .hero,
        .controls,
        .panel,
        .alert {
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(255,255,255,0.055);
          box-shadow: 0 24px 70px rgba(0,0,0,0.28);
          backdrop-filter: blur(18px);
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          border-radius: 28px;
          padding: 14px;
          margin-bottom: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
          font-size: 24px;
          font-weight: 950;
        }

        .brand b {
          display: block;
          font-size: 20px;
          font-weight: 950;
        }

        .brand span {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          font-weight: 800;
        }

        .nav {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .pill {
          border-radius: 999px;
          padding: 11px 15px;
          color: rgba(255,255,255,0.74);
          text-decoration: none;
          background: rgba(255,255,255,0.065);
          font-size: 13px;
          font-weight: 950;
        }

        .pill.active {
          background: #ff7a00;
          color: #101010;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(520px, 1.15fr);
          gap: 16px;
          border-radius: 34px;
          padding: 22px;
          margin-bottom: 16px;
          background:
            radial-gradient(circle at 85% 20%, rgba(255,255,255,0.13), transparent 24%),
            linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.11));
        }

        .hero-copy {
          border-radius: 28px;
          padding: 24px;
          background: rgba(0,0,0,0.28);
        }

        .hero-copy > span,
        .panel-head span,
        .controls label span {
          color: #ff7a00;
          font-size: 12px;
          font-weight: 950;
        }

        .hero-copy h1 {
          margin: 12px 0 12px;
          font-size: clamp(42px, 5vw, 70px);
          line-height: 0.98;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .hero-copy em {
          color: #ff7a00;
          font-style: normal;
        }

        .hero-copy p {
          margin: 0;
          color: rgba(255,255,255,0.68);
          line-height: 1.9;
          font-weight: 700;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .hero-stats article {
          min-height: 165px;
          border-radius: 26px;
          padding: 18px;
          background: rgba(0,0,0,0.32);
          border: 1px solid rgba(255,255,255,0.09);
        }

        .hero-stats svg {
          color: #ff7a00;
          margin-bottom: 14px;
        }

        .hero-stats span {
          display: block;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          font-weight: 950;
        }

        .hero-stats b {
          display: block;
          margin: 10px 0 7px;
          color: #fff;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 950;
        }

        .hero-stats small {
          color: rgba(255,255,255,0.46);
          font-weight: 700;
        }

        .controls {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) minmax(170px, 0.36fr) minmax(170px, 0.36fr);
          gap: 12px;
          border-radius: 28px;
          padding: 18px;
          margin-bottom: 14px;
        }

        .controls label {
          display: grid;
          gap: 8px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-wrap svg {
          color: #ff7a00;
          flex: 0 0 auto;
        }

        input,
        select {
          width: 100%;
          min-height: 50px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          outline: 0;
          background: #070707;
          color: #fff;
          padding: 0 14px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 800;
        }

        .input-wrap input {
          border: 0;
          background: transparent;
          min-height: 48px;
          padding: 0;
        }

        .input-wrap {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          background: #070707;
          padding: 0 14px;
        }

        .alert {
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 14px;
          font-weight: 950;
        }

        .alert.ok {
          color: #86efac;
          border-color: rgba(34,197,94,0.28);
          background: rgba(34,197,94,0.10);
        }

        .alert.bad {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.28);
          background: rgba(239,68,68,0.10);
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(330px, 0.42fr);
          gap: 14px;
        }

        .panel {
          border-radius: 30px;
          padding: 18px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin-bottom: 14px;
        }

        .panel-head h2 {
          margin: 5px 0 0;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 950;
        }

        .panel-head > b {
          min-width: 52px;
          height: 52px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #ff7a00;
          color: #101010;
          font-size: 22px;
          font-weight: 950;
        }

        .orders-list,
        .menu-list {
          display: grid;
          gap: 12px;
        }

        .order-card,
        .menu-card,
        .empty {
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.28);
          border-radius: 26px;
          padding: 16px;
        }

        .order-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px;
          gap: 12px;
          align-items: start;
        }

        .order-title {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-title h3,
        .menu-card h3,
        .empty h3 {
          margin: 0;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 950;
        }

        .order-card p,
        .menu-card p,
        .empty p {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.58);
          line-height: 1.7;
          font-weight: 700;
        }

        .total-box {
          border-radius: 22px;
          padding: 14px;
          background: rgba(255,122,0,0.09);
          border: 1px solid rgba(255,122,0,0.24);
        }

        .total-box span,
        .info-grid span,
        .items-box span {
          color: rgba(255,255,255,0.52);
          font-size: 12px;
          font-weight: 950;
        }

        .total-box b {
          display: block;
          margin-top: 8px;
          color: #ffb56b;
          font-size: 24px;
          font-weight: 950;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .info-grid > div,
        .items-box {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          border-radius: 18px;
          padding: 12px;
        }

        .info-grid b {
          display: block;
          margin-top: 7px;
          color: rgba(255,255,255,0.78);
          font-size: 13px;
          line-height: 1.6;
        }

        .items-box {
          margin-top: 12px;
        }

        .actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        button {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          min-height: 46px;
          padding: 0 12px;
          background: rgba(255,255,255,0.065);
          color: #fff;
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
        }

        button.primary {
          border: 0;
          background: #ff7a00;
          color: #101010;
        }

        button.danger {
          border-color: rgba(239,68,68,0.34);
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .menu-form {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }

        .menu-form button {
          border: 0;
          background: #ff7a00;
          color: #101010;
        }

        .menu-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .price {
          display: block;
          margin: 12px 0;
          color: #ffb56b;
          font-size: 18px;
          font-weight: 950;
        }

        .menu-card button {
          width: 100%;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border: 1px solid;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        .badge.orange {
          border-color: rgba(255,122,0,0.42);
          background: rgba(255,122,0,0.12);
          color: #ffb56b;
        }

        .badge.yellow {
          border-color: rgba(234,179,8,0.42);
          background: rgba(234,179,8,0.12);
          color: #fde68a;
        }

        .badge.sky {
          border-color: rgba(14,165,233,0.42);
          background: rgba(14,165,233,0.12);
          color: #7dd3fc;
        }

        .badge.purple {
          border-color: rgba(168,85,247,0.42);
          background: rgba(168,85,247,0.12);
          color: #d8b4fe;
        }

        .badge.green {
          border-color: rgba(34,197,94,0.42);
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }

        .badge.red {
          border-color: rgba(239,68,68,0.42);
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
        }

        .badge.muted {
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.65);
        }

        @media (max-width: 1060px) {
          .hero,
          .layout {
            grid-template-columns: 1fr;
          }

          .hero-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 14px;
          }

          .topbar,
          .hero,
          .controls,
          .panel {
            border-radius: 24px;
          }

          .hero-stats,
          .controls,
          .info-grid,
          .actions {
            grid-template-columns: 1fr;
          }

          .order-top {
            grid-template-columns: 1fr;
          }

          .nav {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 2px;
          }

          .pill {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </main>
  );
}