"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
  type FuseRole,
  type FuseSession,
} from "@/lib/fuse-auth";

type OrderItem = {
  name?: string;
  title?: string;
  qty?: number;
  quantity?: number;
  price?: number;
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
  driverId?: string;
  driverEmail?: string;
  driverName?: string;
  driverPhone?: string;
  assignedDriverId?: string;
  assignedDriverEmail?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  createdAt?: unknown;
  deliveredAt?: unknown;
  items?: OrderItem[];
};

type DriverIdentity = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

const FALLBACK_DRIVER: DriverIdentity = {
  id: "fuse-driver-demo",
  email: "driver@fuse.iq",
  name: "سائق FUSE",
  phone: "07800000000",
};

const openStatuses = ["جاهز للتوصيل", "قيد التوصيل"];
const doneStatuses = ["تم التسليم", "مرفوض", "ملغي", "Cancelled", "Delivered"];

function clean(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

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

function driverFromSession(session: FuseSession | null): DriverIdentity {
  if (!session || session.role !== "driver") return FALLBACK_DRIVER;

  return {
    id: session.uid || session.email || FALLBACK_DRIVER.id,
    email: session.email || FALLBACK_DRIVER.email,
    name: session.name || session.displayName || FALLBACK_DRIVER.name,
    phone: session.phone || FALLBACK_DRIVER.phone,
  };
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

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  if (status === "Delivered") return "تم التسليم";
  if (status === "Cancelled") return "ملغي";
  return status;
}

function isDoneStatus(status?: string) {
  const cleanStatus = normalizeStatus(status);
  return doneStatuses.includes(cleanStatus);
}

function hasAssignedDriver(order: OrderDoc) {
  return Boolean(
    order.assignedDriverId ||
      order.driverId ||
      order.assignedDriverEmail ||
      order.driverEmail ||
      order.assignedDriverName ||
      order.driverName ||
      order.assignedDriverPhone ||
      order.driverPhone
  );
}

function assignedToDriver(order: OrderDoc, driver: DriverIdentity) {
  const ids = [
    order.assignedDriverId,
    order.driverId,
    order.assignedDriverEmail,
    order.driverEmail,
    order.assignedDriverName,
    order.driverName,
    order.assignedDriverPhone,
    order.driverPhone,
  ].map((value) => clean(value));

  const mine = [driver.id, driver.email, driver.name, driver.phone].map((value) => clean(value));

  return ids.some((value) => value && mine.includes(value));
}

function canPickup(order: OrderDoc) {
  const status = normalizeStatus(order.status);

  return (
    (status === "جاهز للتوصيل" || status === "جاهز") &&
    !hasAssignedDriver(order) &&
    !isDoneStatus(status)
  );
}

function isActiveDriverOrder(order: OrderDoc, driver: DriverIdentity) {
  const status = normalizeStatus(order.status);

  return assignedToDriver(order, driver) && openStatuses.includes(status) && !isDoneStatus(status);
}

function statusClass(status?: string) {
  const cleanStatus = normalizeStatus(status);

  if (cleanStatus === "جاهز للتوصيل") return "sky";
  if (cleanStatus === "قيد التوصيل") return "purple";
  if (cleanStatus === "تم التسليم") return "green";
  if (cleanStatus === "مرفوض" || cleanStatus === "ملغي") return "red";

  return "orange";
}

function phoneHref(phone: string) {
  const cleanPhone = phone.replace(/\s+/g, "");
  return cleanPhone ? `tel:${cleanPhone}` : "#";
}

function whatsappHref(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!cleanPhone) return "#";
  return `https://wa.me/964${cleanPhone.replace(/^0/, "")}`;
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

  if (name === "bike") {
    return (
      <svg {...p}>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M9 17h3l3-7h2" />
        <path d="M10 9h3l2 4" />
        <path d="M5 14l3-5" />
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

  if (name === "money") {
    return (
      <svg {...p}>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
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

  if (name === "pin") {
    return (
      <svg {...p}>
        <path d="M12 21s7-5.4 7-12a7 7 0 10-14 0c0 6.6 7 12 7 12z" />
        <circle cx="12" cy="9" r="2.4" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg {...p}>
        <path d="M22 16.92v3a2 2 0 01-2.18 2A19.8 19.8 0 013 5.18 2 2 0 015 3h3a2 2 0 012 1.72c.12.9.32 1.77.6 2.6a2 2 0 01-.45 2.11L9 10.6a16 16 0 004.4 4.4l1.17-1.15a2 2 0 012.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0122 16.92z" />
      </svg>
    );
  }

  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function DriverAppPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [online, setOnline] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    setSession(saved);

    if (saved && saved.role !== "driver" && saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/login";
    }
  }, []);

  useEffect(() => {
    try {
      const savedOnline = localStorage.getItem("fuse_driver_online");
      if (savedOnline === "0") setOnline(false);
      if (savedOnline === "1") setOnline(true);
    } catch {
      setOnline(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("fuse_driver_online", online ? "1" : "0");
    } catch {
      // ignore
    }
  }, [online]);

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
      },
      (snapshotError) => {
        setError(snapshotError.message || "تعذر تحميل طلبات السائق");
      }
    );

    return () => unsubscribe();
  }, []);

  const driver = useMemo(() => driverFromSession(session), [session]);

  const myActiveOrders = useMemo(
    () => orders.filter((order) => isActiveDriverOrder(order, driver)),
    [driver, orders]
  );

  const pickupOrders = useMemo(
    () => orders.filter(canPickup).slice(0, 20),
    [orders]
  );

  const deliveredOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          assignedToDriver(order, driver) && normalizeStatus(order.status) === "تم التسليم"
      ),
    [driver, orders]
  );

  const totalMoney = myActiveOrders.reduce((sum, order) => sum + getTotal(order), 0);
  const deliveredMoney = deliveredOrders.reduce((sum, order) => sum + getTotal(order), 0);
  const delivering = myActiveOrders.filter((order) => normalizeStatus(order.status) === "قيد التوصيل").length;

  async function updateOrder(order: OrderDoc, status: string) {
    setSavingOrderId(order.documentId);
    setMessage("");
    setError("");

    try {
      await updateDoc(doc(db, "orders", order.documentId), {
        status,
        driverId: driver.id,
        driverEmail: driver.email,
        driverName: driver.name,
        driverPhone: driver.phone,
        assignedDriverId: driver.id,
        assignedDriverEmail: driver.email,
        assignedDriverName: driver.name,
        assignedDriverPhone: driver.phone,
        driverUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(status === "تم التسليم" ? { deliveredAt: serverTimestamp() } : {}),
      });

      setMessage(`تم تحديث طلب ${getCustomer(order)} إلى ${status}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تحديث الطلب");
    } finally {
      setSavingOrderId("");
    }
  }

  async function acceptOrder(order: OrderDoc) {
    await updateOrder(order, "قيد التوصيل");
  }

  function renderOrderCard(order: OrderDoc, mode: "mine" | "pickup") {
    const status = normalizeStatus(order.status);
    const phone = getPhone(order);

    return (
      <article key={order.documentId} className="order-card">
        <div className="order-top">
          <div>
            <span className={`badge ${statusClass(status)}`}>{status}</span>
            <h3>{getCustomer(order)}</h3>
            <p>{getRestaurant(order)} — {formatDate(order.createdAt)}</p>
          </div>

          <div className="total-box">
            <span>المبلغ</span>
            <b>{formatIQD(getTotal(order))}</b>
          </div>
        </div>

        <div className="info-grid">
          <div>
            <span>رقم الطلب</span>
            <b>{order.orderId || order.documentId}</b>
          </div>

          <div>
            <span>هاتف الزبون</span>
            <b dir="ltr">{phone || "—"}</b>
          </div>

          <div>
            <span>العنوان</span>
            <b>{order.address || "غير محدد"}</b>
          </div>
        </div>

        <div className="details-box">
          <span>تفاصيل الطلب</span>

          {order.items?.length ? (
            <div className="items">
              {order.items.map((item, index) => (
                <div key={`${item.name || item.title}-${index}`} className="item-row">
                  <span>{item.name || item.title || "صنف"}</span>
                  <b>
                    {item.qty || item.quantity || 1}x — {formatIQD(Number(item.price || 0))}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <p>ماكو تفاصيل أصناف محفوظة.</p>
          )}
        </div>

        <div className="actions">
          {phone ? (
            <>
              <a href={phoneHref(phone)} className="secondary-action">
                <Icon name="phone" />
                اتصال
              </a>

              <a href={whatsappHref(phone)} target="_blank" className="secondary-action">
                واتساب
              </a>
            </>
          ) : null}

          {mode === "pickup" ? (
            <button
              type="button"
              disabled={!online || savingOrderId === order.documentId}
              onClick={() => acceptOrder(order)}
              className="primary-action"
            >
              {savingOrderId === order.documentId ? "جاري..." : online ? "استلام الطلب" : "أنت غير متصل"}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={savingOrderId === order.documentId || status === "قيد التوصيل"}
                onClick={() => updateOrder(order, "قيد التوصيل")}
                className="secondary-button"
              >
                استلمت الطلب
              </button>

              <button
                type="button"
                disabled={savingOrderId === order.documentId}
                onClick={() => updateOrder(order, "تم التسليم")}
                className="primary-action"
              >
                {savingOrderId === order.documentId ? "جاري..." : "تم التسليم"}
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">
              <Icon name="bike" />
            </div>
            <div>
              <b>FUSE Driver</b>
              <span>{driver.name}</span>
            </div>
          </div>

          <nav className="nav">
            <Link href="/" className="pill">الرئيسية</Link>
            <Link href="/driver-app" className="pill active">السائق</Link>
            <Link href="/live-orders" className="pill">الطلبات المباشرة</Link>
            <Link href="/live-tracking" className="pill">التتبع</Link>
            <Link href="/login" className="pill danger">خروج</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <span>تطبيق السائق</span>
            <h1>
              طلباتك
              <br />
              <em>والتوصيل المباشر</em>
            </h1>
            <p>
              استلم الطلب الجاهز، حدث الحالة، تواصل ويا الزبون، وتابع مبالغك من لوحة واحدة.
            </p>
          </div>

          <div className="stats-grid">
            <article>
              <Icon name="bike" />
              <span>حالتي</span>
              <b className={online ? "green-text" : "red-text"}>{online ? "متصل" : "غير متصل"}</b>
              <small>{driver.phone}</small>
            </article>

            <article>
              <Icon name="orders" />
              <span>طلباتي الحالية</span>
              <b>{myActiveOrders.length}</b>
              <small>قيد التوصيل: {delivering}</small>
            </article>

            <article>
              <Icon name="clock" />
              <span>جاهزة للاستلام</span>
              <b>{pickupOrders.length}</b>
              <small>طلبات غير مخصصة</small>
            </article>

            <article>
              <Icon name="money" />
              <span>مبالغ نشطة</span>
              <b>{formatIQD(totalMoney)}</b>
              <small>مسلمة سابقاً: {formatIQD(deliveredMoney)}</small>
            </article>
          </div>
        </section>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        <section className="layout">
          <section className="panel">
            <div className="panel-head">
              <div>
                <span>My Orders</span>
                <h2>طلباتي الحالية</h2>
              </div>
              <b>{myActiveOrders.length}</b>
            </div>

            {myActiveOrders.length === 0 ? (
              <div className="empty">
                <h3>ماكو طلبات مرتبطة بيك حالياً</h3>
                <p>استلم طلب من قائمة الطلبات الجاهزة حتى يظهر هنا.</p>
              </div>
            ) : (
              <div className="orders-list">
                {myActiveOrders.map((order) => renderOrderCard(order, "mine"))}
              </div>
            )}

            <div className="panel-head second">
              <div>
                <span>Ready Pickup</span>
                <h2>طلبات جاهزة للاستلام</h2>
              </div>
              <b>{pickupOrders.length}</b>
            </div>

            {pickupOrders.length === 0 ? (
              <div className="empty">
                <h3>ماكو طلبات جاهزة</h3>
                <p>أول ما المطعم يضغط جاهز للتوصيل راح تظهر هنا.</p>
              </div>
            ) : (
              <div className="orders-list">
                {pickupOrders.map((order) => renderOrderCard(order, "pickup"))}
              </div>
            )}
          </section>

          <aside className="panel side-panel">
            <div className="panel-head">
              <div>
                <span>Driver Status</span>
                <h2>حالة السائق</h2>
              </div>
            </div>

            <div className="driver-card">
              <div className="avatar">
                <Icon name="bike" />
              </div>

              <h3>{driver.name}</h3>
              <p dir="ltr">{driver.phone}</p>
              <p dir="ltr">{driver.email}</p>

              <span className={`status-pill ${online ? "online" : "offline"}`}>
                {online ? "متصل ويستلم طلبات" : "غير متصل"}
              </span>

              <button type="button" onClick={() => setOnline(true)} className="primary-action wide">
                تشغيل واستلام طلبات
              </button>

              <button type="button" onClick={() => setOnline(false)} className="secondary-button wide">
                إيقاف مؤقت
              </button>
            </div>

            <div className="tips">
              <h3>خطوات التشغيل</h3>

              <div className="tip active">
                <span />
                <b>استلام الطلب</b>
                <p>خذ الطلب الجاهز من المطعم.</p>
              </div>

              <div className="tip active">
                <span />
                <b>قيد التوصيل</b>
                <p>الحالة تتحدث تلقائياً عند الاستلام.</p>
              </div>

              <div className="tip">
                <span />
                <b>تم التسليم</b>
                <p>اضغط تم التسليم بعد الوصول للزبون.</p>
              </div>
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
          width: min(1220px, 100%);
          margin: 0 auto;
        }

        .topbar,
        .hero,
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

        .pill.danger {
          color: #fca5a5;
          background: rgba(239,68,68,0.10);
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1.18fr);
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
        .details-box > span {
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

        .hero-copy p,
        .order-card p,
        .empty p,
        .details-box p,
        .driver-card p,
        .tip p {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.58);
          line-height: 1.7;
          font-weight: 700;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .stats-grid article {
          min-height: 165px;
          border-radius: 26px;
          padding: 18px;
          background: rgba(0,0,0,0.32);
          border: 1px solid rgba(255,255,255,0.09);
        }

        .stats-grid svg {
          color: #ff7a00;
          margin-bottom: 14px;
        }

        .stats-grid span {
          display: block;
          color: rgba(255,255,255,0.55);
          font-size: 12px;
          font-weight: 950;
        }

        .stats-grid b {
          display: block;
          margin: 10px 0 7px;
          color: #fff;
          font-size: 26px;
          line-height: 1.08;
          font-weight: 950;
        }

        .stats-grid small {
          color: rgba(255,255,255,0.46);
          font-weight: 700;
        }

        .green-text {
          color: #86efac !important;
        }

        .red-text {
          color: #fca5a5 !important;
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
          align-items: start;
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

        .panel-head.second {
          margin-top: 26px;
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

        .orders-list {
          display: grid;
          gap: 12px;
        }

        .order-card,
        .empty,
        .driver-card,
        .tips {
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.28);
          border-radius: 26px;
          padding: 16px;
        }

        .order-card {
          background: linear-gradient(135deg, rgba(255,122,0,0.09), rgba(255,255,255,0.035));
        }

        .order-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 210px;
          gap: 12px;
          align-items: start;
        }

        .order-top h3,
        .empty h3,
        .driver-card h3,
        .tips h3 {
          margin: 10px 0 0;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 950;
        }

        .total-box {
          border-radius: 22px;
          padding: 14px;
          background: rgba(255,122,0,0.09);
          border: 1px solid rgba(255,122,0,0.24);
        }

        .total-box span,
        .info-grid span {
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
        .details-box {
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

        .details-box {
          margin-top: 12px;
        }

        .items {
          margin-top: 8px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 10px 0;
          color: rgba(255,255,255,0.76);
        }

        .item-row:last-child {
          border-bottom: 0;
        }

        .actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        button,
        .secondary-action {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          min-height: 46px;
          padding: 0 12px;
          background: rgba(255,255,255,0.065);
          color: #fff;
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          text-decoration: none;
        }

        .primary-action {
          border: 0;
          border-radius: 16px;
          min-height: 46px;
          background: #ff7a00;
          color: #101010;
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .primary-action.wide,
        .secondary-button.wide {
          width: 100%;
          margin-top: 12px;
        }

        .secondary-button {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          min-height: 46px;
          background: rgba(255,255,255,0.065);
          color: #fff;
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .badge,
        .status-pill {
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

        .badge.green,
        .status-pill.online {
          border-color: rgba(34,197,94,0.42);
          background: rgba(34,197,94,0.12);
          color: #86efac;
        }

        .badge.red,
        .status-pill.offline {
          border-color: rgba(239,68,68,0.42);
          background: rgba(239,68,68,0.12);
          color: #fca5a5;
        }

        .avatar {
          width: 70px;
          height: 70px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #ff8a00, #ff3d00);
          color: #101010;
          margin-bottom: 14px;
        }

        .driver-card {
          margin-bottom: 14px;
        }

        .status-pill {
          margin-top: 14px;
        }

        .tips h3 {
          margin-top: 0;
        }

        .tip {
          position: relative;
          border-radius: 18px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          margin-top: 10px;
        }

        .tip > span {
          width: 11px;
          height: 11px;
          display: block;
          border-radius: 999px;
          background: rgba(255,255,255,0.22);
          margin-bottom: 9px;
        }

        .tip.active > span {
          background: #ff7a00;
          box-shadow: 0 0 0 7px rgba(255,122,0,0.12);
        }

        .tip b {
          display: block;
          font-weight: 950;
        }

        @media (max-width: 1060px) {
          .hero,
          .layout {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 720px) {
          .page {
            padding: 14px;
          }

          .topbar,
          .hero,
          .panel {
            border-radius: 24px;
          }

          .stats-grid,
          .info-grid,
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