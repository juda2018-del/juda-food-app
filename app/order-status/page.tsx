"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { parseFuseRole, roleHome } from "@/lib/fuse-auth";

type OrderItem = { name?: string; title?: string; qty?: number; quantity?: number; price?: number };
type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerUid?: string;
  customerName?: string;
  customer?: string;
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
const LOAD_TIMEOUT_MS = 9000;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), LOAD_TIMEOUT_MS)),
  ]);
}

function normalizeStatus(status?: string) {
  if (!status) return "جديد";
  if (status === "جاهز" || status === "ready" || status === "ready_for_delivery") return "جاهز للتوصيل";
  if (status === "السائق استلم") return "قيد التوصيل";
  if (status === "Delivered" || status === "delivered") return "تم التسليم";
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

function timestamp(value: unknown) {
  return toDate(value)?.getTime() || 0;
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

function statusIndex(status?: string) {
  const index = steps.indexOf(normalizeStatus(status));
  return index < 0 ? 0 : index;
}

export default function OrderStatusPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const requestedOrderId = new URLSearchParams(window.location.search).get("orderId") || "";
    setSelectedId(requestedOrderId.trim().toUpperCase());

    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAuthLoading(false);
        setLoading(false);
        router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      try {
        const token = await withTimeout(currentUser.getIdTokenResult(), null);
        if (!token) {
          setUser(currentUser);
          setError("الاتصال بطيء، عرضنا حسابك ونحاول تحميل الطلبات.");
          return;
        }
        const role = parseFuseRole(token.claims.role || token.claims.fuseRole);
        if (role && role !== "customer") {
          router.replace(roleHome[role]);
          return;
        }
        setUser(currentUser);
      } catch {
        setError("تعذر التحقق من الحساب. سجل خروج وادخل مرة ثانية.");
      } finally {
        setAuthLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const loadingTimer = window.setTimeout(() => {
      setLoading(false);
      setError("تأخر الاتصال بالطلبات. تأكد من الإنترنت وحاول مرة ثانية.");
    }, LOAD_TIMEOUT_MS);
    const q = query(collection(db, "orders"), where("customerUid", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        window.clearTimeout(loadingTimer);
        const data = snapshot.docs
          .map((item) => ({ ...(item.data() as Omit<OrderDoc, "documentId">), documentId: item.id }))
          .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
        setOrders(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        window.clearTimeout(loadingTimer);
        setOrders([]);
        setLoading(false);
        setError(snapshotError.message || "تعذر تحميل طلباتك.");
      }
    );
    return () => {
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, [user]);

  const current = useMemo(() => {
    if (!orders.length) return null;
    if (!selectedId) return orders[0];
    return orders.find((order) => String(order.orderId || "").toUpperCase() === selectedId) || null;
  }, [orders, selectedId]);

  const currentStep = statusIndex(current?.status);
  const total = Number(current?.total || current?.amount || 0);
  const itemCount = current?.items?.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0) || 0;
  const busy = authLoading || loading;

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
          <h2>كل طلباتك بمكان واحد</h2>
          <p>يتم تحميل الطلبات المرتبطة بحسابك فقط، بدون بحث عام بالهاتف أو كشف طلبات الآخرين.</p>
        </section>

        {orders.length > 1 ? (
          <section className="picker">
            <label>اختار الطلب</label>
            <select value={selectedId || String(orders[0]?.orderId || "")} onChange={(event) => setSelectedId(event.target.value)}>
              {orders.map((order) => (
                <option key={order.documentId} value={String(order.orderId || "").toUpperCase()}>
                  {order.orderId || order.documentId.slice(0, 8)} — {normalizeStatus(order.status)}
                </option>
              ))}
            </select>
          </section>
        ) : null}

        {busy ? (
          <section className="state"><b>جاري تحميل طلباتك...</b></section>
        ) : error ? (
          <section className="state bad"><b>تعذر تحميل الطلبات</b><p>{error}</p></section>
        ) : !orders.length ? (
          <section className="state"><b>ما عندك طلبات بعد</b><p>اختار مطعم وأرسل أول طلب.</p><Link href="/restaurants">تصفح المطاعم</Link></section>
        ) : !current ? (
          <section className="state bad"><b>هذا الطلب مو تابع لحسابك</b><p>اختار طلباً من القائمة.</p></section>
        ) : (
          <article className="orderCard">
            <div className="orderHead">
              <div><span>رقم الطلب</span><b>{current.orderId || current.documentId}</b></div>
              <strong>{normalizeStatus(current.status)}</strong>
            </div>

            <div className="infoGrid">
              <div><span>المطعم</span><b>{current.restaurantName || current.restaurant || "مطعم"}</b></div>
              <div><span>المبلغ</span><b>{total.toLocaleString("en-US")} د.ع</b></div>
              <div><span>السائق</span><b>{current.assignedDriverName || current.driverName || "لم يُحدد بعد"}</b></div>
              <div><span>العنوان</span><b>{current.address || "غير محدد"}</b></div>
              <div><span>الأصناف</span><b>{itemCount}</b></div>
              <div><span>وقت الطلب</span><b>{formatDate(current.createdAt)}</b></div>
            </div>

            <div className="progress">
              {steps.map((step, index) => (
                <div className={index <= currentStep ? "active" : ""} key={step}><i /><span>{step}</span></div>
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

            {normalizeStatus(current.status) === "تم التسليم" ? (
              <Link className="rate" href={`/ratings?orderDocumentId=${encodeURIComponent(current.documentId)}`}>قيّم هذا الطلب</Link>
            ) : null}
          </article>
        )}

      </section>

      <style jsx>{`
        *{box-sizing:border-box}.page{min-height:100dvh;background:transparent;color:#15171a;font-family:var(--fuse-body-font);padding:0}.phone{width:min(100%,430px);min-height:100dvh;margin:auto;background:transparent;padding:0}.top{display:grid;grid-template-columns:46px 1fr 46px;align-items:center;gap:10px;margin-bottom:14px;padding:8px 10px;border-radius:28px;background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.95);box-shadow:0 10px 28px rgba(21,23,26,.08);backdrop-filter:blur(22px) saturate(145%)}.back,.support{height:46px;border-radius:50%;background:rgba(255,252,247,.92);color:#1f7a4f;text-decoration:none;display:grid;place-items:center;box-shadow:0 8px 22px rgba(21,23,26,.06);font-weight:900;border:1px solid rgba(21,23,26,.08)}.back{font-size:26px}.support{font-size:11px;border-radius:18px;background:rgba(31,122,79,.12)}.heading{text-align:center}.heading span{font-size:11px;color:#1f7a4f;font-weight:900}.heading h1{margin:2px 0 0;font-size:24px;font-family:var(--fuse-title-font)}.hero{background:radial-gradient(circle at 18% 40%,rgba(255,255,255,.14),transparent 38%),linear-gradient(135deg,#1a2235,#263759);color:#fff;border-radius:28px;padding:20px;margin-bottom:14px;box-shadow:0 16px 42px rgba(65,55,38,.12)}.hero span{color:rgba(255,255,255,.72);font-size:12px;font-weight:900}.hero h2{margin:7px 0;font-size:25px}.hero p{margin:0;color:rgba(255,255,255,.78);line-height:1.7;font-size:13px}.picker,.orderCard,.state{background:rgba(255,252,247,.82);border:1px solid rgba(255,255,255,.92);border-radius:22px;padding:16px;box-shadow:0 10px 28px rgba(21,23,26,.08);margin-bottom:14px;backdrop-filter:blur(22px) saturate(145%)}.picker{display:grid;gap:8px}.picker label{font-size:13px;font-weight:900}.picker select{width:100%;border:1px solid rgba(21,23,26,.08);border-radius:16px;padding:14px;background:rgba(255,255,255,.72);font:inherit}.state{text-align:center;padding:24px 16px}.state b{font-size:17px}.state p{color:#6f7175;margin:8px 0 14px}.state a,.rate{display:block;border-radius:18px;background:linear-gradient(135deg,#1f7a4f,#2f915f);color:#fff;padding:13px;text-align:center;text-decoration:none;font-weight:900;box-shadow:0 12px 28px rgba(31,122,79,.22)}.state.bad{background:rgba(254,226,226,.72);color:#991b1b}.orderHead{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:14px;border-bottom:1px solid rgba(21,23,26,.08)}.orderHead span,.infoGrid span{display:block;color:#6f7175;font-size:11px;font-weight:800}.orderHead b{display:block;margin-top:4px}.orderHead strong{color:#1f7a4f}.infoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.infoGrid div{background:rgba(31,122,79,.08);border-radius:15px;padding:11px}.infoGrid b{display:block;margin-top:5px;font-size:12px;overflow-wrap:anywhere}.progress{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin:18px 0}.progress div{text-align:center;color:#a8aaad;font-size:8px;font-weight:800}.progress i{display:block;width:13px;height:13px;border-radius:50%;background:#ddd;margin:0 auto 6px}.progress .active{color:#1f7a4f}.progress .active i{background:#1f7a4f;box-shadow:0 0 0 4px rgba(31,122,79,.18)}.items{border-top:1px solid rgba(21,23,26,.08);padding-top:13px}.items h3{margin:0 0 8px}.item{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(21,23,26,.06);font-size:12px}.item b{color:#1f7a4f}.rate{margin-top:15px}
      `}</style>
    </main>
  );
}
