"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { parseFuseRole, roleHome } from "@/lib/fuse-auth";
import { fuseCustomerProgressIndex, normalizeFuseOrderStatus } from "@/lib/fuse-order-status";
import FuseIcon from "@/components/FuseIcon";

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
  return normalizeFuseOrderStatus(status);
}

function statusIndex(status?: string) {
  return fuseCustomerProgressIndex(status);
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
        setUser(null);
        setOrders([]);
        setAuthLoading(false);
        setLoading(false);
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
          <Link href="/" className="back fuse-back-btn" aria-label="الرئيسية"><FuseIcon name="chevron-back" /></Link>
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
        ) : !user ? (
          <section className="state">
            <b>سجّل الدخول لمتابعة طلباتك</b>
            <p>بعد الدخول تظهر كل طلباتك تلقائياً بدون بحث بالهاتف.</p>
            <Link href={`/login?next=${encodeURIComponent("/order-status")}`}>تسجيل الدخول</Link>
            <Link className="ghost-link" href="/restaurants">تصفح المطاعم</Link>
          </section>
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

    </main>
  );
}
