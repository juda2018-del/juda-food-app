"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, type QueryConstraint } from "firebase/firestore";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, roleHome, type FuseSession } from "@/lib/fuse-auth";

type OrderItem = { name?: string; title?: string; qty?: number; quantity?: number; price?: number };
type OrderDoc = {
  documentId: string; orderId?: string; customerName?: string; customer?: string; name?: string;
  phone?: string; customerPhone?: string; address?: string; restaurant?: string; restaurantName?: string;
  restaurantId?: string; total?: number; amount?: number; status?: string; driverId?: string;
  driverEmail?: string; assignedDriverId?: string; assignedDriverEmail?: string; driverName?: string;
  assignedDriverName?: string; createdAt?: unknown; items?: OrderItem[];
};

const statuses = ["الكل", "جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم", "مرفوض"];

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch { return null; }
}
function normalizeStatus(value?: string) {
  if (!value) return "جديد";
  if (value === "جاهز") return "جاهز للتوصيل";
  if (value === "السائق استلم") return "قيد التوصيل";
  if (value === "Delivered") return "تم التسليم";
  return value;
}
function orderName(order: OrderDoc) { return order.customerName || order.customer || order.name || "زبون"; }
function orderPhone(order: OrderDoc) { return order.phone || order.customerPhone || ""; }
function restaurantName(order: OrderDoc) { return order.restaurantName || order.restaurant || "مطعم"; }
function money(value?: number) { return `${Number(value || 0).toLocaleString("en-US")} د.ع`; }
function formatDate(value: unknown) {
  try {
    if (!value) return "بدون وقت";
    const date = typeof value === "object" && value !== null && "toDate" in value
      ? (value as { toDate: () => Date }).toDate() : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? "بدون وقت" : date.toLocaleString("ar-IQ");
  } catch { return "بدون وقت"; }
}
function belongsToDriver(order: OrderDoc, session: FuseSession) {
  const ids = [order.driverId, order.assignedDriverId, order.driverEmail, order.assignedDriverEmail]
    .map((v) => String(v || "").trim().toLowerCase());
  const mine = [session.uid, session.email].map((v) => String(v || "").trim().toLowerCase());
  return ids.some((v) => v && mine.includes(v));
}

export default function LiveOrdersPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("الكل");

  useEffect(() => {
    const saved = readSession();
    if (!saved) { window.location.href = "/login?next=/live-orders"; return; }
    if (!["admin", "restaurant", "driver"].includes(saved.role)) {
      window.location.href = roleHome[saved.role] || "/"; return;
    }
    if (saved.role === "restaurant" && !(saved.restaurantId || saved.restaurant || saved.restaurantName)) {
      setError("هذا الحساب غير مربوط بمطعم. اربطه من لوحة الإدارة أولاً.");
      setLoading(false);
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session || error) return;
    const constraints: QueryConstraint[] = [];
    if (session.role === "restaurant") {
      const restaurantId = session.restaurantId || session.restaurant;
      if (restaurantId) constraints.push(where("restaurantId", "==", restaurantId));
    } else if (session.role === "driver") {
      constraints.push(where("assignedDriverEmail", "==", session.email));
    }
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, "orders"), ...constraints);
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ ...(doc.data() as Omit<OrderDoc, "documentId">), documentId: doc.id }));
      setOrders(session.role === "driver" ? data.filter((o) => belongsToDriver(o, session)) : data);
      setLoading(false); setError("");
    }, (e) => { setError(e.message || "تعذر تحميل الطلبات"); setLoading(false); });
  }, [session, error]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const sameStatus = status === "الكل" || normalizeStatus(order.status) === status;
      const text = [orderName(order), orderPhone(order), restaurantName(order), order.orderId, order.documentId, order.address]
        .join(" ").toLowerCase();
      return sameStatus && (!term || text.includes(term));
    }).slice(0, 100);
  }, [orders, search, status]);

  const active = orders.filter((o) => !["تم التسليم", "مرفوض", "ملغي"].includes(normalizeStatus(o.status))).length;
  const newCount = orders.filter((o) => normalizeStatus(o.status) === "جديد").length;
  const ready = orders.filter((o) => normalizeStatus(o.status) === "جاهز للتوصيل").length;

  return <main dir="rtl" className="page"><section className="shell">
    <header className="top"><div><small>FUSE Operations</small><h1>الطلبات المباشرة</h1><p>كل دور يشوف الطلبات المسموحة له فقط.</p></div><nav><Link href={session ? roleHome[session.role] : "/login"}>لوحتي</Link><Link href="/">الرئيسية</Link></nav></header>
    <section className="stats"><article><span>الكل</span><b>{orders.length}</b></article><article><span>جديدة</span><b>{newCount}</b></article><article><span>جاهزة</span><b>{ready}</b></article><article><span>نشطة</span><b>{active}</b></article></section>
    <section className="filters"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث برقم الطلب، الزبون، الهاتف أو المطعم"/><select value={status} onChange={(e)=>setStatus(e.target.value)}>{statuses.map((s)=><option key={s}>{s}</option>)}</select></section>
    {loading ? <div className="state">جاري تحميل الطلبات...</div> : error ? <div className="state bad">{error}</div> : !visible.length ? <div className="state">ماكو طلبات مطابقة حالياً.</div> : <section className="list">{visible.map((order)=><article className="card" key={order.documentId}>
      <div className="head"><div><span className="badge">{normalizeStatus(order.status)}</span><h2>{orderName(order)}</h2><p>{restaurantName(order)} — {formatDate(order.createdAt)}</p></div><strong>{money(order.total || order.amount)}</strong></div>
      <div className="info"><div><span>رقم الطلب</span><b>{order.orderId || order.documentId}</b></div><div><span>الهاتف</span><b dir="ltr">{orderPhone(order) || "—"}</b></div><div><span>العنوان</span><b>{order.address || "غير محدد"}</b></div><div><span>السائق</span><b>{order.assignedDriverName || order.driverName || "غير مخصص"}</b></div></div>
      {order.items?.length ? <div className="items">{order.items.map((item,i)=><div key={i}><span>{item.name || item.title || "صنف"}</span><b>{item.qty || item.quantity || 1} × {money(item.price)}</b></div>)}</div> : null}
    </article>)}</section>}
  </section><style jsx>{`
    *{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at top right,rgba(255,122,0,.16),transparent 32%),#050505;color:#fff;padding:20px 12px;font-family:Arial,sans-serif}.shell{max-width:1100px;margin:auto}.top{display:flex;justify-content:space-between;gap:14px;align-items:center;background:#111;border:1px solid #292929;border-radius:28px;padding:20px}.top small{color:#ff7a00;font-weight:900}.top h1{margin:5px 0;font-size:34px}.top p{margin:0;color:#999}.top nav{display:flex;gap:8px}.top a{color:#fff;text-decoration:none;background:#1d1d1d;border-radius:14px;padding:11px 14px;font-weight:900}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.stats article{background:#111;border:1px solid #292929;border-radius:20px;padding:16px;display:grid;gap:8px}.stats span{color:#999}.stats b{font-size:28px;color:#ff7a00}.filters{display:grid;grid-template-columns:1fr 220px;gap:10px;margin-bottom:14px}.filters input,.filters select{width:100%;background:#0b0b0b;color:#fff;border:1px solid #333;border-radius:16px;padding:14px;font:inherit}.list{display:grid;gap:12px}.card{background:#111;border:1px solid #2b2b2b;border-radius:24px;padding:17px}.head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.head h2{margin:9px 0 4px}.head p{margin:0;color:#999}.head strong{color:#ff9a42;font-size:22px}.badge{display:inline-block;background:#2b1a0d;color:#ffb56b;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}.info{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.info div,.items{background:#080808;border-radius:15px;padding:11px}.info span{display:block;color:#888;font-size:11px;margin-bottom:6px}.info b{font-size:13px;overflow-wrap:anywhere}.items{margin-top:10px}.items div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid #222;font-size:12px}.items div:first-child{border-top:0}.state{text-align:center;background:#111;border:1px dashed #333;border-radius:22px;padding:28px;color:#aaa}.state.bad{color:#ff9b9b;border-color:#633}@media(max-width:700px){.top{align-items:flex-start}.top h1{font-size:27px}.stats{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr}.info{grid-template-columns:1fr 1fr}.head{display:grid}.top nav{flex-direction:column}.top a{text-align:center}}`}</style></main>;
}
