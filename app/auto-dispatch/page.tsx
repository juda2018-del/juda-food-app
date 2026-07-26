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
  type FuseSession,
} from "@/lib/fuse-auth";

type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerName?: string;
  customer?: string;
  phone?: string;
  customerPhone?: string;
  address?: string;
  restaurant?: string;
  restaurantName?: string;
  status?: string;
  total?: number;
  amount?: number;
  assignedDriverId?: string;
  assignedDriverEmail?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  driverId?: string;
  driverEmail?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: unknown;
};

type DriverDoc = {
  documentId: string;
  uid?: string;
  email?: string;
  name?: string;
  driverName?: string;
  phone?: string;
  driverPhone?: string;
  status?: string;
  online?: boolean;
  isOnline?: boolean;
  available?: boolean;
  rating?: number;
  completedOrders?: number;
  area?: string;
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

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (["جاهز", "ready", "ready_for_delivery"].includes(status)) return "جاهز للتوصيل";
  return status;
}

function isReady(order: OrderDoc) {
  return normalizeStatus(order.status) === "جاهز للتوصيل";
}

function isAssigned(order: OrderDoc) {
  return Boolean(
    order.assignedDriverId ||
      order.assignedDriverEmail ||
      order.assignedDriverName ||
      order.driverId ||
      order.driverEmail ||
      order.driverName
  );
}

function driverName(driver: DriverDoc) {
  return (driver.name || driver.driverName || "سائق").trim();
}

function driverPhone(driver: DriverDoc) {
  return (driver.phone || driver.driverPhone || "").trim();
}

function driverEmail(driver: DriverDoc) {
  return (driver.email || "").trim().toLowerCase();
}

function isDriverOnline(driver: DriverDoc) {
  return (
    driver.online === true ||
    driver.isOnline === true ||
    driver.available === true ||
    driver.status === "متصل" ||
    driver.status === "online"
  );
}

function driverScore(driver: DriverDoc) {
  const rating = Number(driver.rating || 0);
  const completed = Number(driver.completedOrders || 0);
  return Math.round(rating * 10 + Math.min(completed, 50));
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || "زبون";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getTotal(order: OrderDoc) {
  return Number(order.total || order.amount || 0);
}

export default function AutoDispatchPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [drivers, setDrivers] = useState<DriverDoc[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/auto-dispatch";
      return;
    }
    if (saved.role !== "admin") {
      window.location.href = roleHome[saved.role] || "/";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session) return;

    const stopOrders = onSnapshot(
      query(collection(db, "orders")),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<OrderDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      (snapshotError) => setError(snapshotError.message || "تعذر تحميل الطلبات")
    );

    const stopDrivers = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        setDrivers(
          snapshot.docs.map((item) => ({
            ...(item.data() as Omit<DriverDoc, "documentId">),
            documentId: item.id,
          }))
        );
      },
      (snapshotError) => setError(snapshotError.message || "تعذر تحميل السائقين")
    );

    return () => {
      stopOrders();
      stopDrivers();
    };
  }, [session]);

  const readyOrders = useMemo(
    () => orders.filter((order) => isReady(order) && !isAssigned(order)),
    [orders]
  );

  const activeDrivers = useMemo(
    () =>
      drivers
        .filter((driver) => isDriverOnline(driver) && Boolean(driverEmail(driver)))
        .sort((a, b) => driverScore(b) - driverScore(a)),
    [drivers]
  );

  useEffect(() => {
    if (!readyOrders.some((order) => order.documentId === selectedOrderId)) {
      setSelectedOrderId(readyOrders[0]?.documentId || "");
    }
  }, [readyOrders, selectedOrderId]);

  useEffect(() => {
    if (!activeDrivers.some((driver) => driver.documentId === selectedDriverId)) {
      setSelectedDriverId(activeDrivers[0]?.documentId || "");
    }
  }, [activeDrivers, selectedDriverId]);

  const selectedOrder = readyOrders.find((order) => order.documentId === selectedOrderId) || null;
  const selectedDriver = activeDrivers.find((driver) => driver.documentId === selectedDriverId) || null;

  async function assignOrder() {
    setMessage("");
    setError("");

    if (!selectedOrder) return setError("اختار طلباً جاهزاً للتوصيل.");
    if (!selectedDriver) return setError("اختار سائقاً متصلاً ومربوطاً ببريد دخول.");
    if (!isReady(selectedOrder) || isAssigned(selectedOrder)) {
      return setError("هذا الطلب لم يعد متاحاً للتوزيع.");
    }

    const email = driverEmail(selectedDriver);
    if (!email) return setError("السائق غير مربوط ببريد دخول.");

    setSaving(true);
    try {
      const name = driverName(selectedDriver);
      const phone = driverPhone(selectedDriver);
      const id = selectedDriver.uid || selectedDriver.documentId;

      await updateDoc(doc(db, "orders", selectedOrder.documentId), {
        status: "جاهز للتوصيل",
        assignedDriverId: id,
        assignedDriverEmail: email,
        assignedDriverName: name,
        assignedDriverPhone: phone,
        driverId: id,
        driverEmail: email,
        driverName: name,
        driverPhone: phone,
        assignedAt: serverTimestamp(),
        assignedBy: session?.email || "admin",
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        type: "driver",
        role: "driver",
        title: "طلب جديد مخصص إلك",
        message: `تم تخصيص طلب ${getCustomer(selectedOrder)} من ${getRestaurant(selectedOrder)} إلك.`,
        orderId: selectedOrder.orderId || selectedOrder.documentId,
        driverId: id,
        driverEmail: email,
        read: false,
        createdAt: serverTimestamp(),
      });

      setMessage(`تم تخصيص الطلب للسائق ${name}. ينتظر السائق حتى يبدأ التوصيل.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر تخصيص الطلب");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="page">
      <section className="shell">
        <header className="topbar">
          <div><small>FUSE Dispatch</small><h1>توزيع الطلبات</h1></div>
          <nav>
            <Link href="/fuse-admin">الإدارة</Link>
            <Link href="/drivers-admin">السائقون</Link>
            <Link href="/restaurant-admin">المطاعم</Link>
          </nav>
        </header>

        <section className="hero">
          <div><span>توزيع آمن</span><h2>اربط الطلب بالسائق<br />والسائق يبدأ التوصيل بنفسه</h2></div>
          <div className="stats"><b>{readyOrders.length}</b><span>طلبات جاهزة</span></div>
          <div className="stats"><b>{activeDrivers.length}</b><span>سائقون متصلون</span></div>
        </section>

        {message ? <div className="alert ok">{message}</div> : null}
        {error ? <div className="alert bad">{error}</div> : null}

        <section className="layout">
          <section className="panel">
            <div className="panel-head"><h2>الطلب</h2><b>{readyOrders.length}</b></div>
            <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)}>
              <option value="">اختار طلباً</option>
              {readyOrders.map((order) => (
                <option key={order.documentId} value={order.documentId}>
                  {order.orderId || order.documentId} — {getRestaurant(order)} — {getTotal(order).toLocaleString("en-US")} د.ع
                </option>
              ))}
            </select>
            {selectedOrder ? (
              <article className="card">
                <h3>{getCustomer(selectedOrder)}</h3>
                <p>{getRestaurant(selectedOrder)}</p>
                <p dir="ltr">{getPhone(selectedOrder) || "بدون هاتف"}</p>
                <p>{selectedOrder.address || "بدون عنوان"}</p>
                <strong>{getTotal(selectedOrder).toLocaleString("en-US")} د.ع</strong>
              </article>
            ) : <div className="empty">ماكو طلبات بحالة جاهز للتوصيل وغير مخصصة.</div>}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>السائق</h2><b>{activeDrivers.length}</b></div>
            <select value={selectedDriverId} onChange={(event) => setSelectedDriverId(event.target.value)}>
              <option value="">اختار سائقاً</option>
              {activeDrivers.map((driver) => (
                <option key={driver.documentId} value={driver.documentId}>
                  {driverName(driver)} — {driver.area || "بغداد"} — تقييم {Number(driver.rating || 0).toFixed(1)}
                </option>
              ))}
            </select>
            {selectedDriver ? (
              <article className="card">
                <h3>{driverName(selectedDriver)}</h3>
                <p dir="ltr">{driverPhone(selectedDriver) || "بدون هاتف"}</p>
                <p dir="ltr">{driverEmail(selectedDriver)}</p>
                <strong>متصل — Score {driverScore(selectedDriver)}</strong>
              </article>
            ) : <div className="empty">ماكو سائق متصل ومربوط ببريد دخول.</div>}
            <button type="button" onClick={assignOrder} disabled={saving || !selectedOrder || !selectedDriver}>
              {saving ? "جاري التخصيص..." : "تخصيص الطلب للسائق"}
            </button>
          </section>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.16),transparent 32%),#050505;color:#fff;padding:20px 12px;font-family:Arial,sans-serif}.shell{max-width:1050px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}.topbar small,.hero span{color:#ff7a00;font-weight:900}.topbar h1{margin:4px 0 0}.topbar nav{display:flex;gap:8px;flex-wrap:wrap}.topbar a{color:#fff;text-decoration:none;border:1px solid #333;background:#111;border-radius:13px;padding:10px 12px;font-weight:900}.hero{display:grid;grid-template-columns:1fr 150px 150px;gap:12px;background:linear-gradient(135deg,#171717,#30261f);border:1px solid #39312b;border-radius:28px;padding:20px;margin-bottom:16px}.hero h2{font-size:32px;line-height:1.25;margin:8px 0 0}.stats{background:#090909;border:1px solid #333;border-radius:20px;display:grid;place-items:center;align-content:center;text-align:center}.stats b{font-size:34px;color:#ff7a00}.stats span{font-size:12px;color:#aaa}.layout{display:grid;grid-template-columns:1fr 1fr;gap:14px}.panel{background:#111;border:1px solid #333;border-radius:25px;padding:17px}.panel-head{display:flex;justify-content:space-between;align-items:center}.panel-head h2{margin:0}.panel-head b{background:#ff7a00;color:#000;padding:8px 11px;border-radius:12px}select{width:100%;margin-top:14px;background:#050505;color:#fff;border:1px solid #333;border-radius:15px;padding:14px;font:inherit}.card,.empty{margin-top:12px;background:#080808;border:1px solid #2f2f2f;border-radius:19px;padding:15px}.card h3{font-size:23px;margin:0}.card p{color:#aaa;line-height:1.6}.card strong{color:#ffad66}.empty{color:#aaa;text-align:center}button{width:100%;margin-top:13px;border:0;border-radius:16px;background:#ff7a00;color:#000;padding:15px;font-weight:950;font-size:15px}button:disabled{background:#333;color:#777}.alert{border-radius:16px;padding:13px;margin-bottom:13px;font-weight:900}.ok{background:#12351d;color:#9cffb8}.bad{background:#401313;color:#ffaaaa}@media(max-width:720px){.topbar{align-items:flex-start}.hero{grid-template-columns:1fr}.stats{min-height:100px}.layout{grid-template-columns:1fr}.hero h2{font-size:26px}}
      `}</style>
    </main>
  );
}
