"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

type OrderItem = { name?: string; title?: string; qty?: number; quantity?: number; price?: number };
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

function normalizePhone(value: string) {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  if (digits.startsWith("964")) return `0${digits.slice(3)}`;
  return digits;
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
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [current, setCurrent] = useState<OrderDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("orderId") || params.get("order") || params.get("phone") || "";
    setSearch(initial);
    if (initial.trim()) setSubmitted(initial.trim());
  }, []);

  useEffect(() => {
    const raw = submitted.trim();
    if (!raw) {
      setCurrent(null);
      setSearched(false);
      setLoading(false);
      return;
    }

    const normalized = clean(raw);
    const looksLikeOrderId = normalized.startsWith("fuse") || /[a-z]/i.test(normalized);
    const phone = normalizePhone(raw);
    const looksLikePhone = /^0\d{10}$/.test(phone);

    if (!looksLikeOrderId && !looksLikePhone) {
      setCurrent(null);
      setSearched(true);
      setLoading(false);
      setLoadError("اكتب رقم طلب كامل أو رقم هاتف عراقي صحيح.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setLoadError("");
    setCurrent(null);

    const ordersRef = collection(db, "orders");
    const q = looksLikeOrderId
      ? query(ordersRef, where("orderId", "==", raw.trim().toUpperCase()), limit(1))
      : query(ordersRef, where("phone", "==", phone), orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const first = snapshot.docs[0];
        setCurrent(
          first
            ? ({ ...(first.data() as Omit<OrderDoc, "documentId">), documentId: first.id } as OrderDoc)
            : null
        );
        setLoading(false);
        setLoadError("");
      },
      (error) => {
        setCurrent(null);
        setLoading(false);
        setLoadError(error.message || "تعذر تحميل الطلب.");
      }
    );

    return () => unsubscribe();
  }, [submitted]);

  const currentStep = statusIndex(current?.status);
  const total = Number(current?.total || current?.amount || 0);
  const itemCount = useMemo(
    () => current?.items?.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0) || 0,
    [current]
  );

  function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(search.trim());
  }

  return (
    <main dir="rtl" className="page">
      <section className="phone">
        <header className="top">
          <Link href="/" className="back">‹</Link>
          <div className="heading"><span>FUSE Iraq</span><h1>طلباتي</h1></div>
          <Link href="/support" className="support">دعم</Link>
        </header>

        <section className="hero">
          <span>تتبع مباشر وآمن</span>
          <h2>اعرف وين وصل طلبك</h2>
          <p>يتم تحميل الطلب المطابق فقط، بدون قراءة طلبات باقي الزبائن.</p>
        </section>

        <form className="searchBox" onSubmit={runSearch}>
          <label>رقم الطلب أو الهاتف</label>
          <div className="searchRow">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="FUSE-123456 أو 0770..." dir="ltr" autoComplete="tel" />
            <button type="submit">بحث</button>
          </div>
          <small>البحث الجزئي أو البحث بالاسم غير مسموح.</small>
        </form>

        {loading ? (
          <section className="state"><b>جاري تحميل طلبك...</b></section>
        ) : loadError ? (
          <section className="state bad"><b>تعذر تحميل الطلب</b><p>{loadError}</p></section>
        ) : !searched ? (
          <section className="state"><b>اكتب رقم طلبك</b><p>سيظهر آخر تحديث مباشرة.</p></section>
        ) : !current ? (
          <section className="state"><b>ما لقينا طلب مطابق</b><p>تأكد من الرقم واكتبه كاملاً.</p></section>
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
              <div><span>الأصناف</span><b>{itemCount}</b></div>
              <div className="wide"><span>وقت الطلب</span><b>{formatDate(current.createdAt)}</b></div>
            </div>

            <div className="progress">
              {steps.map((step, index) => (
                <div className={index <= currentStep ? "active" : ""} key={step}>
                  <i /><span>{step}</span>
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
        *{box-sizing:border-box}.page{min-height:100vh;background:#efe8df;color:#171717;font-family:Arial,sans-serif}.phone{width:min(100%,430px);min-height:100vh;margin:auto;background:linear-gradient(180deg,#fffaf4,#fff);padding:18px 18px 112px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.back,.support{height:44px;min-width:44px;border-radius:15px;background:#fff;color:#171717;text-decoration:none;display:grid;place-items:center;box-shadow:0 10px 25px rgba(0,0,0,.07);font-weight:900}.back{font-size:30px}.support{font-size:12px;color:#f45100;padding:0 12px}.heading{text-align:center}.heading span{font-size:11px;color:#f45100;font-weight:900}.heading h1{margin:2px 0 0;font-size:25px}.hero{background:linear-gradient(135deg,#151515,#2c2c2c);color:#fff;border-radius:28px;padding:22px;margin-bottom:14px}.hero span{color:#ff8a00;font-size:12px;font-weight:900}.hero h2{margin:7px 0;font-size:27px}.hero p{margin:0;color:#ccc;line-height:1.7;font-size:13px}.searchBox,.orderCard,.state{background:#fff;border-radius:24px;padding:17px;box-shadow:0 13px 32px rgba(0,0,0,.07);margin-bottom:14px}.searchBox label{display:block;font-size:13px;font-weight:900;margin-bottom:8px}.searchRow{display:grid;grid-template-columns:1fr auto;gap:8px}.searchBox input{width:100%;border:1px solid #ece4dc;border-radius:16px;padding:14px;font:inherit;outline:none}.searchBox button{border:0;border-radius:16px;padding:0 18px;background:#ff5a00;color:#fff;font-weight:900}.searchBox small{display:block;color:#8a8179;font-size:11px;line-height:1.6;margin-top:8px}.state{text-align:center;padding:28px 18px}.state b{font-size:19px}.state p{color:#817870;margin:8px 0 0}.state.bad{background:#fff0f0;color:#a52323}.orderHead{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid #f0e8df}.orderHead div{display:grid;gap:4px}.orderHead span,.infoGrid span{font-size:11px;color:#8c837a;font-weight:800}.orderHead strong{background:#fff1e5;color:#e64b00;padding:9px 12px;border-radius:999px;font-size:12px}.infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.infoGrid div{background:#fff8f1;border-radius:16px;padding:12px;display:grid;gap:6px}.infoGrid .wide{grid-column:1/-1}.infoGrid b{font-size:13px;overflow-wrap:anywhere}.progress{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:18px 0}.progress div{display:grid;gap:7px;text-align:center}.progress i{height:6px;border-radius:99px;background:#e7ddd3}.progress .active i{background:#ff5a00}.progress span{font-size:9px;color:#91877e;font-weight:800}.progress .active span{color:#d94d00}.items{background:#fff8f1;border-radius:18px;padding:14px}.items h3{margin:0 0 8px;font-size:15px}.items p{color:#82786f;font-size:12px}.item{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #eee3d8;font-size:12px}.item:first-of-type{border-top:0}.bottom{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,430px);display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid #eee3da;box-shadow:0 -10px 30px rgba(0,0,0,.08);padding:8px 8px calc(8px + env(safe-area-inset-bottom));z-index:50}.bottom a{min-height:58px;color:#777;text-decoration:none;display:grid;place-content:center;text-align:center;font-size:20px;font-weight:900}.bottom span{display:block;font-size:10px;margin-top:2px}.bottom .selected{color:#ff5a00}@media(max-width:360px){.infoGrid{grid-template-columns:1fr}.infoGrid .wide{grid-column:auto}.progress span{font-size:8px}.searchRow{grid-template-columns:1fr}.searchBox button{height:46px}}
      `}</style>
    </main>
  );
}
