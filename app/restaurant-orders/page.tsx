"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  DocumentData,
  Firestore,
  getFirestore,
  onSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";

type AnyRecord = Record<string, any>;

type LiveOrder = AnyRecord & {
  id: string;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebase(): { app: FirebaseApp; db: Firestore } {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      "Firebase ENV ناقصة: " +
        missing.join(", ") +
        ". تأكد من Vercel Environment Variables."
    );
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  return { app, db };
}

function normalizeOrder(
  snap: QueryDocumentSnapshot<DocumentData>
): LiveOrder {
  return {
    id: snap.id,
    ...snap.data(),
  };
}

function toMillis(value: any): number {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function formatDate(value: any): string {
  const millis = toMillis(value);

  if (!millis) return "بدون وقت";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(millis));
}

function getOrderTime(order: LiveOrder): number {
  return (
    toMillis(order.createdAt) ||
    toMillis(order.created_at) ||
    toMillis(order.created) ||
    toMillis(order.date) ||
    toMillis(order.updatedAt)
  );
}

function pickText(order: LiveOrder, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = order[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function pickNumber(order: LiveOrder, keys: string[]): number | null {
  for (const key of keys) {
    const value = order[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const cleaned = value.replace(/[^\d.]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

function formatIQD(value: number | null): string {
  if (value === null) return "غير محدد";

  return (
    new Intl.NumberFormat("ar-IQ", {
      maximumFractionDigits: 0,
    }).format(value) + " د.ع"
  );
}

function extractItems(order: LiveOrder): any[] {
  const possible =
    order.items ||
    order.cart ||
    order.orderItems ||
    order.products ||
    order.meals ||
    [];

  if (Array.isArray(possible)) {
    return possible;
  }

  if (possible && typeof possible === "object") {
    return Object.values(possible);
  }

  return [];
}

function getItemName(item: any): string {
  if (typeof item === "string") return item;

  return (
    item?.name ||
    item?.title ||
    item?.itemName ||
    item?.mealName ||
    item?.productName ||
    "مادة بدون اسم"
  );
}

function getItemQty(item: any): number {
  const value =
    item?.qty ??
    item?.quantity ??
    item?.count ??
    item?.amount ??
    1;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getItemPrice(item: any): number | null {
  const value =
    item?.price ??
    item?.unitPrice ??
    item?.itemPrice ??
    item?.totalPrice ??
    item?.total;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateItemsTotal(items: any[]): number | null {
  let total = 0;
  let hasPrice = false;

  for (const item of items) {
    const price = getItemPrice(item);
    const qty = getItemQty(item);

    if (price !== null) {
      hasPrice = true;
      total += price * qty;
    }
  }

  return hasPrice ? total : null;
}

function statusLabel(status: string): string {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("new")) return "جديد";
  if (normalized.includes("pending")) return "بانتظار القبول";
  if (normalized.includes("preparing")) return "قيد التحضير";
  if (normalized.includes("ready")) return "جاهز";
  if (normalized.includes("delivery") || normalized.includes("delivering")) return "قيد التوصيل";
  if (normalized.includes("done") || normalized.includes("delivered")) return "تم التسليم";
  if (normalized.includes("cancel") || normalized.includes("reject")) return "ملغي / مرفوض";

  return status || "جديد";
}

function OrderCard({ order }: { order: LiveOrder }) {
  const items = extractItems(order);

  const restaurantName = pickText(
    order,
    ["restaurantName", "restaurant", "storeName", "branchName"],
    "مطعم غير محدد"
  );

  const customerName = pickText(
    order,
    ["customerName", "name", "clientName", "userName"],
    "زبون غير محدد"
  );

  const phone = pickText(
    order,
    ["customerPhone", "phone", "mobile", "clientPhone"],
    "لا يوجد رقم"
  );

  const address = pickText(
    order,
    ["address", "customerAddress", "deliveryAddress", "locationText"],
    "لا يوجد عنوان"
  );

  const notes = pickText(
    order,
    ["notes", "note", "customerNote", "deliveryNote"],
    ""
  );

  const status = statusLabel(
    pickText(order, ["status", "orderStatus", "state"], "جديد")
  );

  const directTotal = pickNumber(order, [
    "total",
    "totalPrice",
    "grandTotal",
    "amount",
    "subtotal",
  ]);

  const calculatedTotal = calculateItemsTotal(items);
  const finalTotal = directTotal ?? calculatedTotal;

  return (
    <article className="rounded-[28px] border border-orange-500/20 bg-[#111116] p-5 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-black">
              {status}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              {formatDate(order.createdAt || order.created_at || order.created || order.date || order.updatedAt)}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white">
            طلب #{order.id.slice(0, 7)}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            المطعم: <span className="font-bold text-zinc-100">{restaurantName}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-right">
          <p className="text-xs text-zinc-400">الإجمالي</p>
          <p className="text-2xl font-black text-orange-400">
            {formatIQD(finalTotal)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-xs text-zinc-500">الزبون</p>
          <p className="mt-1 font-bold text-white">{customerName}</p>
        </div>

        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-xs text-zinc-500">الهاتف</p>
          <p className="mt-1 font-bold text-white">{phone}</p>
        </div>

        <div className="rounded-2xl bg-black/25 p-4">
          <p className="text-xs text-zinc-500">العنوان</p>
          <p className="mt-1 font-bold text-white">{address}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1fr_80px_120px] bg-white/5 px-4 py-3 text-xs font-bold text-zinc-400">
            <span>المادة</span>
            <span className="text-center">الكمية</span>
            <span className="text-left">السعر</span>
          </div>

          <div className="divide-y divide-white/10">
            {items.map((item, index) => {
              const price = getItemPrice(item);
              const qty = getItemQty(item);

              return (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_80px_120px] px-4 py-3 text-sm"
                >
                  <span className="font-bold text-white">{getItemName(item)}</span>
                  <span className="text-center text-zinc-300">{qty}</span>
                  <span className="text-left text-zinc-300">
                    {formatIQD(price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          هذا الطلب وصل، لكن ما لكيت مصفوفة items/cart داخل الدوكمنت.
        </div>
      )}

      {notes ? (
        <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
          <p className="text-xs font-bold text-orange-300">ملاحظات الزبون</p>
          <p className="mt-1 text-sm text-orange-50">{notes}</p>
        </div>
      ) : null}

      <details className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <summary className="cursor-pointer text-sm font-bold text-zinc-300">
          عرض بيانات Firestore الخام
        </summary>
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-left text-xs text-zinc-400" dir="ltr">
          {JSON.stringify(order, null, 2)}
        </pre>
      </details>
    </article>
  );
}

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    try {
      const { app, db } = getFirebase();
      const auth = getAuth(app);

      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);

        if (unsubscribeOrders) {
          unsubscribeOrders();
          unsubscribeOrders = undefined;
        }

        setLoading(true);
        setError("");

        unsubscribeOrders = onSnapshot(
          collection(db, "orders"),
          (snapshot) => {
            const liveOrders = snapshot.docs
              .map(normalizeOrder)
              .sort((a, b) => getOrderTime(b) - getOrderTime(a));

            setOrders(liveOrders);
            setLoading(false);
          },
          (firestoreError) => {
            console.error("Firestore orders error:", firestoreError);
            setError(
              firestoreError?.message ||
                "صار خطأ بقراءة orders من Firestore."
            );
            setLoading(false);
          }
        );
      });

      return () => {
        unsubscribeAuth();
        if (unsubscribeOrders) unsubscribeOrders();
      };
    } catch (setupError: any) {
      console.error("Restaurant orders setup error:", setupError);
      setError(setupError?.message || "صار خطأ بتجهيز Firebase.");
      setLoading(false);
      setAuthReady(true);
    }
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const newOrders = orders.filter((order) => {
      const status = String(order.status || order.orderStatus || "").toLowerCase();
      return !status || status.includes("new") || status.includes("pending") || status === "جديد";
    }).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const time = getOrderTime(order);
      return time >= todayStart.getTime();
    }).length;

    return { total, newOrders, todayOrders };
  }, [orders]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[32px] border border-orange-500/20 bg-[#111116] p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-orange-400">
                FUSE Restaurant Orders
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                الطلبات الحقيقية من Firestore
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                هاي صفحة مستقلة وآمنة تقرأ collection اسمها{" "}
                <span className="font-black text-orange-300">orders</span>{" "}
                بدون لمس لوحة المطعم القديمة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/customer"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                فتح صفحة الزبون
              </Link>

              <Link
                href="/restaurant-admin"
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black hover:bg-orange-400"
              >
                رجوع للوحة المطعم
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">كل الطلبات</p>
            <p className="mt-2 text-3xl font-black text-white">{stats.total}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">طلبات جديدة</p>
            <p className="mt-2 text-3xl font-black text-orange-400">{stats.newOrders}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">طلبات اليوم</p>
            <p className="mt-2 text-3xl font-black text-white">{stats.todayOrders}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">حالة الحساب</p>
            <p className="mt-2 truncate text-sm font-bold text-zinc-200">
              {!authReady
                ? "جاري الفحص..."
                : user?.email
                  ? user.email
                  : "غير مسجل دخول"}
            </p>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            <p className="font-black">ما قدرنا نقرأ orders</p>
            <p className="mt-2 text-sm leading-7">{error}</p>
            <p className="mt-3 text-sm text-red-200/80">
              إذا الخطأ permission-denied، افتح نفس المتصفح بعد تسجيل دخول restaurant@fuse.iq.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#111116] p-10 text-center text-zinc-400">
            جاري تحميل الطلبات من Firestore...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-orange-500/30 bg-[#111116] p-10 text-center">
            <p className="text-2xl font-black text-white">ماكو طلبات بعد</p>
            <p className="mt-3 text-sm text-zinc-400">
              افتح /customer، أرسل طلب جديد، وارجع هنا. إذا الطلب انرسل صح راح يظهر مباشرة.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
