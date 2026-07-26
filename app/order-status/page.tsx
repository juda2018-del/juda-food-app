"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

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
  driverName?: string;
  assignedDriverName?: string;
  createdAt?: unknown;
  items?: OrderItem[];
};

const steps = ["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function clean(value: string) {
  return normalizeDigits(value).replace(/[\s-]+/g, "").trim().toLowerCase();
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
  if (!date) return "الوقت غير متوفر";
  return date.toLocaleString("ar-IQ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم";
}

function getDriver(order: OrderDoc) {
  const assigned = String(order.assignedDriverName || "").trim();
  const direct = String(order.driverName || "").trim();
  if (assigned) return assigned;
  if (direct && direct !== "FUSE إدارة" && direct !== "إدارة FUSE") return direct;
  return "لم يُحدد بعد";
}

function statusIndex(status?: string) {
  const index = steps.indexOf(normalizeStatus(status));
  return index < 0 ? 0 : index;
}

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("orderId") || params.get("order") || params.get("phone") || "");
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "orders")),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        }));
        data.sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
        setOrders(data);
        setLoadError(false);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const current = useMemo(() => {
    const value = clean(search);
    if (!value) return null;

    const looksLikeOrderId = value.startsWith("fuse") || /[a-z]/i.test(value);
    const looksLikePhone = /^\d{10,13}$/.test(value);
    if (!looksLikeOrderId && !looksLikePhone) return null;

    return orders.find((order) => {
      const orderId = clean(order.orderId || order.documentId);
      const phone = clean(getPhone(order));
      return looksLikeOrderId ? orderId === value : phone === value;
    }) || null;
  }, [orders, search]);

  const currentStep = statusIndex(current?.status);
  const total = Number(current?.total || current?.amount || 0);

  return (
    <main dir="rtl" className="page">
      <section className="phone">
        <header className="top">
          <Link href="/" className="back">‹</Link>
          <div className="heading"><span>FUSE Iraq</span><h1>طلباتي</h1></div>
          <Link href="/support" className="support">دعم</Link>
        </header>

        <section className="hero">
          <span>تتبع مباشر</span>
          <h2>اعرف وين وصل طلبك</h2>
          <p>اكتب رقم الطلب الكامل أو رقم الهاتف الكامل المستخدم عند الطلب.</p>
        </section>

        <section className="searchBox">
          <label>رقم الطلب أو الهاتف</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="FUSE-123456 أو 0770..."
            dir="ltr"
            autoComplete="tel"
          />
          <small>لحماية خصوصيتك، البحث الجزئي أو البحث بالاسم غير مسموح.</small>
        </section>

        {loading ? (
          <section className="state"><b>جاري تحميل طلباتك...</b></section>
        ) : loadError ? (
          <section className="state bad"><b>تعذر الاتصال بالطلبات</b><p>تأكد من الإنترنت وحاول مرة ثانية.</p></section>
        ) : !search.trim() ? (
          <section className="state"><b>اكتب رقم طلبك</b><p>سيظهر آخر تحديث مباشرة.</p></section>
        ) : !current ? (
          <section className="state"><b>ما لقينا طلب مطابق</b><p>اكتب الرقم كاملاً بدون نقص.</p></section>
        ) : (
          <article className="orderCard">
            <div className="orderHead">
              <div><span>رقم الطلب</span><b>{current.orderId || current.documentId}</b></div>
              <strong>{normalizeStatus(current.status)}</strong>
            </div>

            <div className="infoGrid">
              <div><span>المطعم</span><b>{getRestaurant(current)}</b></div>
              <div><span>الزبون</span><b>{getCustomer(current)}</b></div>
              <div><span>المبلغ</span><b>{total.toLocaleString("en-US")} د.ع</b></div>
              <div><span>السائق</span><b>{getDriver(current)}</b></div>
              <div><span>العنوان</span><b>{current.address || "غير محدد"}</b></div>
              <div><span>وقت الطلب</span><b>{formatDate(current.createdAt)}</b></div>
            </div>

            <div className="progress">
              {steps.map((step, index) => (
                <div className={index <= currentStep ? "active" : ""} key={step}>
                  <i />
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <section className="items">
              <h3>تفاصيل الطلب</h3>
              {current.items?.length ? current.items.map((item, index) => (
                <div className="item" key={`${item.name || item.title}-${index}`}>
                  <span>{item.name || item.title || "صنف"}</span>
                  <b>{item.qty || item.quantity || 1} × {Number(item.price || 0).toLocaleString("en-US")} د.ع</b>
                </div>
              )) : <p>تفاصيل الأصناف غير متوفرة.</p>}
            </section>
          </article>
        )}

        <nav className="bottom">
          <Link href="/">⌂<span>الرئيسية</span></Link>
          <Link href="/restaurants">⌕<span>المطاعم</span></Link>
          <Link href="/reels">▶<span>ريلز</span></Link>
          <Link href="/order-status" className="selected">▣<span>طلباتي</span></Link>
          <Link href="/profile">○<span>حسابي</span></Link>
        </nav>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100vh;background:#efe8df;color:#171717;font-family:Arial,sans-serif}.phone{width:min(100%,430px);min-height:100vh;margin:auto;background:linear-gradient(180deg,#fffaf4,#fff);padding:18px 18px 112px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.back,.support{height:44px;min-width:44px;border-radius:15px;background:#fff;color:#171717;text-decoration:none;display:grid;place-items:center;box-shadow:0 10px 25px rgba(0,0,0,.07);font-weight:900}.back{font-size:30px}.support{font-size:12px;color:#f45100;padding:0 12px}.heading{text-align:center}.heading span{font-size:11px;color:#f45100;font-weight:900}.heading h1{margin:2px 0 0;font-size:25px}.hero{background:linear-gradient(135deg,#151515,#2c2c2c);color:#fff;border-radius:28px;padding:22px;margin-bottom:14px}.hero span{color:#ff8a00;font-size:12px;font-weight:900}.hero h2{margin:7px 0;font-size:27px}.hero p{margin:0;color:#ccc;line-height:1.7;font-size:13px}.searchBox,.orderCard,.state{background:#fff;border-radius:24px;padding:17px;box-shadow:0 13px 32px rgba(0,0,0,.07);margin-bottom:14px}.searchBox label{display:block;font-size:13px;font-weight:900;margin-bottom:8px}.searchBox input{width:100%;border:1px solid #ece4dc;border-radius:16px;padding:14px;font:inherit;outline:none}.searchBox small{display:block;color:#8a8179;font-size:11px;line-height:1.6;margin-top:8px}.state{text-align:center;padding:28px 18px}.state b{font-size:19px}.state p{color:#817870;margin:8px 0 0}.state.bad{background:#fff0f0;color:#a52323}.orderHead{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid #f0e8df}.orderHead div{display:grid;gap:4px}.orderHead span,.infoGrid span{font-size:11px;color:#8c837a;font-weight:800}.orderHead strong{background:#fff1e5;color:#e64b00;padding:9px 12px;border-radius:999px;font-size:12px}.infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.infoGrid div{background:#fff8f1;border-radius:16px;padding:12px;display:grid;gap:6px}.infoGrid b{font-size:13px;overflow-wrap:anywhere}.progress{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:18px 0}.progress div{display:grid;gap:7px;text-align:center}.progress i{height:6px;border-radius:99px;background:#e7ddd3}.progress .active i{background:#ff5a00}.progress span{font-size:9px;color:#91877e;font-weight:800}.progress .active span{color:#d94d00}.items{background:#fff8f1;border-radius:18px;padding:14px}.items h3{margin:0 0 8px;font-size:15px}.items p{color:#82786f;font-size:12px}.item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #eee3d8;font-size:12px}.item:first-of-type{border-top:0}.bottom{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,430px);display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid #eee2d7;padding:8px 6px max(8px,env(safe-area-inset-bottom));z-index:20}.bottom a{display:grid;place-items:center;gap:3px;color:#8c837b;text-decoration:none;font-size:19px}.bottom span{font-size:10px;font-weight:800}.bottom .selected{color:#f45100}.bottom .selected span{font-weight:950}@media(min-width:520px){.phone{box-shadow:0 20px 70px rgba(0,0,0,.12)}}
      `}</style>
    </main>
  );
}
