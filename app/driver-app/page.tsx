"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FUSE_LOCAL_SESSION,
  parseFuseRole,
  roleHome,
  type FuseSession,
} from "@/lib/fuse-auth";
import { normalizeFuseOrderStatus } from "@/lib/fuse-order-status";

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
  assignedDriverId?: string;
  assignedDriverEmail?: string;
  assignedDriverName?: string;
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

const activeStatuses = ["جاهز للتوصيل", "قيد التوصيل"];

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
    if (typeof value === "object" && value !== null && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") return (fn as () => Date)();
    }
    const date = value instanceof Date ? value : new Date(value as string | number);
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
  });
}

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

function belongsToDriver(order: OrderDoc, driver: DriverIdentity) {
  const values = [
    order.assignedDriverId,
    order.driverId,
    order.assignedDriverEmail,
    order.driverEmail,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const mine = [driver.id, driver.email]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  return values.some((value) => mine.includes(value));
}

function phoneHref(phone: string) {
  const value = phone.replace(/\s+/g, "");
  return value ? `tel:${value}` : "#";
}

function whatsappHref(phone: string) {
  const value = phone.replace(/\D/g, "");
  if (!value) return "#";
  const international = value.startsWith("964") ? value : `964${value.replace(/^0/, "")}`;
  return `https://wa.me/${international}`;
}

export default function DriverAppPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.replace("/login?next=/driver-app");
      return;
    }
    if (saved.role !== "driver") {
      window.location.replace(roleHome[saved.role] || "/");
      return;
    }
    setSession(saved);
    setOnline(localStorage.getItem("fuse_driver_online") !== "0");
  }, []);

  const driver = useMemo<DriverIdentity | null>(() => {
    if (!session || session.role !== "driver") return null;
    return {
      id: session.uid || session.email,
      email: session.email,
      name: session.name || session.displayName || "سائق FUSE",
      phone: session.phone || "",
    };
  }, [session]);

  useEffect(() => {
    if (!driver) return;

    const merged = new Map<string, OrderDoc>();
    const refresh = () => {
      const data = Array.from(merged.values()).filter((item) => belongsToDriver(item, driver));
      data.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
      setOrders(data);
      setLoading(false);
    };

    const listeners = [
      query(collection(db, "orders"), where("assignedDriverEmail", "==", driver.email)),
      query(collection(db, "orders"), where("driverEmail", "==", driver.email)),
      query(collection(db, "orders"), where("assignedDriverId", "==", driver.id)),
      query(collection(db, "orders"), where("driverId", "==", driver.id)),
    ].map((request) =>
      onSnapshot(
        request,
        (snapshot) => {
          snapshot.docs.forEach((item) => {
            merged.set(item.id, {
              ...(item.data() as Omit<OrderDoc, "documentId">),
              documentId: item.id,
            });
          });
          refresh();
          setError("");
        },
        () => {
          setLoading(false);
          setError("تعذر تحميل طلبات السائق المخصصة.");
        }
      )
    );

    return () => listeners.forEach((unsubscribe) => unsubscribe());
  }, [driver]);

  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.includes(normalizeFuseOrderStatus(order.status))),
    [orders]
  );

  const deliveredOrders = useMemo(
    () => orders.filter((order) => normalizeFuseOrderStatus(order.status) === "تم التسليم"),
    [orders]
  );

  async function toggleOnline() {
    if (!driver) return;
    const next = !online;
    setOnline(next);
    localStorage.setItem("fuse_driver_online", next ? "1" : "0");
    setError("");
    try {
      const snapshot = await getDocs(
        query(collection(db, "drivers"), where("email", "==", driver.email))
      );
      if (snapshot.empty) {
        setError("حساب السائق غير مسجل في النظام. راجع إدارة FUSE.");
        return;
      }
      await Promise.all(
        snapshot.docs.map((item) =>
          updateDoc(item.ref, {
            online: next,
            isOnline: next,
            status: next ? "متصل" : "غير متصل",
            updatedAt: serverTimestamp(),
          })
        )
      );
      setMessage(next ? "تم تفعيل حالة الاتصال." : "تم إيقاف حالة الاتصال.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "تعذر تحديث حالة الاتصال في Firebase.");
    }
  }

  async function updateOrder(order: OrderDoc, status: "قيد التوصيل" | "تم التسليم") {
    if (!driver || !belongsToDriver(order, driver)) {
      setError("هذا الطلب غير مخصص لحسابك.");
      return;
    }

    const currentStatus = normalizeFuseOrderStatus(order.status);
    if (status === "قيد التوصيل" && currentStatus !== "جاهز للتوصيل") {
      setError("لا يمكن استلام الطلب قبل أن يصبح جاهزاً للتوصيل.");
      return;
    }
    if (status === "تم التسليم" && currentStatus !== "قيد التوصيل") {
      setError("ابدأ التوصيل أولاً قبل تأكيد التسليم.");
      return;
    }

    setSavingOrderId(order.documentId);
    setError("");
    setMessage("");

    try {
      await updateDoc(doc(db, "orders", order.documentId), {
        status,
        driverId: driver.id,
        driverEmail: driver.email,
        driverName: driver.name,
        assignedDriverId: driver.id,
        assignedDriverEmail: driver.email,
        assignedDriverName: driver.name,
        driverUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(status === "تم التسليم" ? { deliveredAt: serverTimestamp() } : {}),
      });
      setMessage(status === "تم التسليم" ? "تم تأكيد تسليم الطلب." : "تم بدء التوصيل.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تحديث الطلب.");
    } finally {
      setSavingOrderId("");
    }
  }

  if (!session || !driver) {
    return <main dir="rtl" className="loading">جاري التحقق من حساب السائق...</main>;
  }

  const activeMoney = activeOrders.reduce((sum, order) => sum + getTotal(order), 0);

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div><small>FUSE Driver</small><h1>{driver.name}</h1></div>
          <nav>
            <Link href="/">الرئيسية</Link>
            <button type="button" className={online ? "online" : "offline"} onClick={toggleOnline}>
              {online ? "متصل" : "غير متصل"}
            </button>
            <Link href="/login" className="danger">خروج</Link>
          </nav>
        </header>

        <section className="hero">
          <div><span>طلبات مخصصة لحسابك فقط</span><h2>توصيل آمن وواضح</h2><p>لا تظهر هنا إلا الطلبات التي خصصتها الإدارة لك.</p></div>
          <div className="stats">
            <article><span>الحالية</span><b>{activeOrders.length}</b></article>
            <article><span>المسلّمة</span><b>{deliveredOrders.length}</b></article>
            <article><span>مبالغ نشطة</span><b>{formatIQD(activeMoney)}</b></article>
          </div>
        </section>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        <section className="panel">
          <div className="panel-head"><div><small>My Orders</small><h2>طلباتي الحالية</h2></div><b>{activeOrders.length}</b></div>

          {loading ? <div className="empty">جاري تحميل طلباتك...</div> : activeOrders.length ? activeOrders.map((order) => {
            const status = normalizeFuseOrderStatus(order.status);
            const phone = getPhone(order);
            return (
              <article className="order" key={order.documentId}>
                <div className="order-head">
                  <div><span>{status}</span><h3>{getCustomer(order)}</h3><p>{getRestaurant(order)} — {formatDate(order.createdAt)}</p></div>
                  <strong>{formatIQD(getTotal(order))}</strong>
                </div>
                <div className="info">
                  <div><span>رقم الطلب</span><b>{order.orderId || order.documentId}</b></div>
                  <div><span>الهاتف</span><b dir="ltr">{phone || "—"}</b></div>
                  <div><span>العنوان</span><b>{order.address || "غير محدد"}</b></div>
                </div>
                {order.items?.length ? <div className="items">{order.items.map((item, index) => <div key={`${item.name || item.title}-${index}`}><span>{item.name || item.title || "صنف"}</span><b>{item.qty || item.quantity || 1} × {formatIQD(Number(item.price || 0))}</b></div>)}</div> : null}
                <div className="actions">
                  {phone ? <><a href={phoneHref(phone)}>اتصال</a><a href={whatsappHref(phone)} target="_blank" rel="noreferrer">واتساب</a></> : null}
                  {status === "جاهز للتوصيل" ? <button type="button" disabled={!online || savingOrderId === order.documentId} onClick={() => updateOrder(order, "قيد التوصيل")}>{savingOrderId === order.documentId ? "جاري..." : online ? "استلمت الطلب" : "أنت غير متصل"}</button> : null}
                  {status === "قيد التوصيل" ? <button type="button" disabled={savingOrderId === order.documentId} onClick={() => updateOrder(order, "تم التسليم")}>{savingOrderId === order.documentId ? "جاري..." : "تم التسليم"}</button> : null}
                </div>
              </article>
            );
          }) : <div className="empty"><h3>ماكو طلبات مخصصة إلك حالياً</h3><p>لما الإدارة تخصص طلب لحسابك راح يظهر هنا مباشرة.</p></div>}
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.loading,.page{min-height:100vh;background:#050505;color:#fff;font-family:Arial,sans-serif}.loading{display:grid;place-items:center}.page{padding:20px 12px}.shell{max-width:980px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}.topbar small,.panel-head small,.hero span{color:#ff7a00;font-weight:900}.topbar h1{margin:5px 0 0}.topbar nav{display:flex;gap:8px;flex-wrap:wrap}.topbar a,.topbar button{border:1px solid #333;background:#151515;color:#fff;text-decoration:none;border-radius:13px;padding:10px 13px;font-weight:900}.topbar .online{background:#12351d;color:#9cffb8}.topbar .offline,.topbar .danger{background:#401313;color:#ffaaaa}.hero,.panel{background:#151210;border:1px solid #34302e;border-radius:28px;padding:18px;margin-bottom:15px}.hero{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}.hero h2{font-size:34px;margin:8px 0}.hero p{color:#aaa}.stats{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:9px}.stats article{background:#080808;border-radius:18px;padding:15px}.stats span{display:block;color:#999;font-size:12px}.stats b{display:block;margin-top:8px;font-size:22px}.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.panel-head h2{margin:5px 0}.panel-head>b{background:#ff7a00;color:#050505;border-radius:12px;padding:9px 12px}.order{background:#090909;border:1px solid #303030;border-radius:22px;padding:15px;margin-bottom:10px}.order-head{display:flex;justify-content:space-between;gap:12px}.order-head span{color:#ff9d4d;font-size:12px;font-weight:900}.order-head h3{margin:5px 0;font-size:23px}.order-head p{margin:0;color:#999}.order-head strong{color:#ff8a2b}.info{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:13px 0}.info div{background:#151515;border-radius:14px;padding:11px}.info span{display:block;color:#888;font-size:11px}.info b{display:block;margin-top:5px;overflow-wrap:anywhere}.items{background:#111;border-radius:16px;padding:10px}.items div{display:flex;justify-content:space-between;gap:10px;padding:8px;border-top:1px solid #252525}.items div:first-child{border-top:0}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.actions a,.actions button{border:0;border-radius:13px;padding:11px 14px;background:#222;color:#fff;text-decoration:none;font-weight:900}.actions button{background:#ff7a00;color:#050505}.actions button:disabled{opacity:.55}.empty{text-align:center;border:1px dashed #333;border-radius:20px;padding:25px;color:#aaa}.empty h3{color:#fff}.alert{border-radius:14px;padding:12px;margin-bottom:12px;font-weight:900}.ok{background:#12351d;color:#9cffb8}.bad{background:#401313;color:#ffaaaa}@media(max-width:720px){.topbar,.hero{display:block}.topbar nav{margin-top:12px}.stats{grid-template-columns:1fr;margin-top:14px}.info{grid-template-columns:1fr}.order-head{display:block}.order-head strong{display:block;margin-top:10px}.actions>*{flex:1;text-align:center}}
      `}</style>
    </main>
  );
}
