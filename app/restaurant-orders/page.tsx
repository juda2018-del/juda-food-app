
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";

type FuseOrder = {
  id: string;
  [key: string]: any;
};

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY", fallbackConfig.apiKey),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", fallbackConfig.authDomain),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", fallbackConfig.projectId),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", fallbackConfig.storageBucket),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", fallbackConfig.messagingSenderId),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID", fallbackConfig.appId),
};

const CONFIG_SOURCE = "lib/firebase/client.ts";

function getFuseApp() {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function orderTime(order: FuseOrder): number {
  return (
    toMillis(order.createdAt) ||
    toMillis(order.created_at) ||
    toMillis(order.created) ||
    toMillis(order.date) ||
    toMillis(order.updatedAt)
  );
}

function formatDate(value: any): string {
  const millis = toMillis(value);
  if (!millis) return "بدون وقت";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(millis));
}

function getText(order: FuseOrder, keys: string[], fallback: string): string {
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

function getNumber(order: FuseOrder, keys: string[]): number | null {
  for (const key of keys) {
    const value = order[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

function money(value: number | null): string {
  if (value === null) return "غير محدد";

  return (
    new Intl.NumberFormat("ar-IQ", {
      maximumFractionDigits: 0,
    }).format(value) + " د.ع"
  );
}

function getItems(order: FuseOrder): any[] {
  const raw =
    order.items ||
    order.cart ||
    order.orderItems ||
    order.products ||
    order.meals ||
    [];

  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return Object.values(raw);

  return [];
}

function itemName(item: any): string {
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

function itemQty(item: any): number {
  const qty = Number(item?.qty ?? item?.quantity ?? item?.count ?? 1);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function itemPrice(item: any): number | null {
  const price = Number(
    item?.price ??
      item?.unitPrice ??
      item?.itemPrice ??
      item?.totalPrice ??
      item?.total ??
      0
  );

  return Number.isFinite(price) && price > 0 ? price : null;
}

function orderStatus(order: FuseOrder): string {
  return getText(order, ["status", "orderStatus", "state"], "جديد");
}

export default function RestaurantOrdersPage() {
  const [orders, setOrders] = useState<FuseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("جاري الفحص...");

  useEffect(() => {
    let unsubscribeOrders: undefined | (() => void);

    try {
      const app = getFuseApp();
      const auth = getAuth(app);
      const db = getFirestore(app);

      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setEmail(user?.email || "غير مسجل دخول");

        if (unsubscribeOrders) {
          unsubscribeOrders();
        }

        setLoading(true);
        setError("");

        unsubscribeOrders = onSnapshot(
          collection(db, "orders"),
          (snapshot) => {
            const nextOrders = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .sort((a, b) => orderTime(b) - orderTime(a));

            setOrders(nextOrders);
            setLoading(false);
          },
          (err) => {
            console.error("FUSE orders Firestore error:", err);
            setError(err?.message || "Firestore read error");
            setLoading(false);
          }
        );
      });

      return () => {
        unsubscribeAuth();

        if (unsubscribeOrders) {
          unsubscribeOrders();
        }
      };
    } catch (err: any) {
      console.error("FUSE restaurant-orders setup error:", err);
      setError(err?.message || "Firebase setup error");
      setLoading(false);
    }
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: orders.length,
      today: orders.filter((order) => orderTime(order) >= today.getTime()).length,
      newOrders: orders.filter((order) => {
        const status = String(orderStatus(order)).toLowerCase();
        return (
          status === "جديد" ||
          status.includes("new") ||
          status.includes("pending")
        );
      }).length,
    };
  }, [orders]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#050505] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[32px] border border-orange-500/25 bg-[#111116] p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-orange-400">
                FUSE /restaurant-orders
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                الطلبات الحقيقية من Firestore
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                صفحة مستقلة وآمنة تقرأ collection اسمها orders بدون لمس restaurant-admin.
              </p>

              <p className="mt-2 text-xs text-zinc-600">
                Firebase source: {CONFIG_SOURCE}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/customer"
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black hover:bg-orange-400"
              >
                فتح الزبون
              </Link>

              <Link
                href="/restaurant-admin"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                رجوع للوحة المطعم
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">كل الطلبات</p>
            <p className="mt-2 text-4xl font-black">{stats.total}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">طلبات اليوم</p>
            <p className="mt-2 text-4xl font-black text-orange-400">{stats.today}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">طلبات جديدة</p>
            <p className="mt-2 text-4xl font-black">{stats.newOrders}</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#111116] p-5">
            <p className="text-xs text-zinc-500">الحساب الحالي</p>
            <p className="mt-2 truncate text-sm font-bold">{email}</p>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-[24px] border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            <p className="font-black">خطأ بقراءة Firestore</p>
            <p className="mt-2 text-sm leading-7">{error}</p>
            <p className="mt-3 text-sm text-red-200/80">
              إذا مكتوب permission-denied، سجل دخول restaurant@fuse.iq بنفس المتصفح.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#111116] p-10 text-center text-zinc-400">
            جاري تحميل orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-orange-500/30 bg-[#111116] p-10 text-center">
            <p className="text-2xl font-black">ماكو طلبات بعد</p>
            <p className="mt-3 text-sm text-zinc-400">
              أرسل طلب من /customer وارجع هنا. إذا Firestore حفظ الطلب، يظهر هنا مباشرة.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => {
              const items = getItems(order);
              const total = getNumber(order, [
                "total",
                "totalPrice",
                "grandTotal",
                "amount",
                "subtotal",
                "finalTotal",
              ]);

              return (
                <article
                  key={order.id}
                  className="rounded-[28px] border border-white/10 bg-[#111116] p-5 shadow-2xl shadow-black/30"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-black">
                          {orderStatus(order)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                          {formatDate(
                            order.createdAt ||
                              order.created_at ||
                              order.created ||
                              order.date ||
                              order.updatedAt
                          )}
                        </span>
                      </div>

                      <p className="text-sm text-orange-400">
                        طلب #{order.id.slice(0, 8)}
                      </p>

                      <h2 className="mt-1 text-2xl font-black">
                        {getText(
                          order,
                          ["restaurantName", "restaurant", "storeName", "branchName"],
                          "مطعم غير محدد"
                        )}
                      </h2>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                      <p className="text-xs text-zinc-500">الإجمالي</p>
                      <p className="text-2xl font-black text-orange-400">
                        {money(total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">الزبون</p>
                      <p className="mt-1 font-bold">
                        {getText(
                          order,
                          ["customerName", "name", "clientName", "userName"],
                          "زبون غير محدد"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">الهاتف</p>
                      <p className="mt-1 font-bold">
                        {getText(
                          order,
                          ["customerPhone", "phone", "mobile", "clientPhone"],
                          "غير محدد"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">العنوان</p>
                      <p className="mt-1 font-bold">
                        {getText(
                          order,
                          ["address", "customerAddress", "deliveryAddress", "locationText"],
                          "غير محدد"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-[1fr_80px_120px] bg-white/5 px-4 py-3 text-xs font-bold text-zinc-400">
                      <span>المادة</span>
                      <span className="text-center">الكمية</span>
                      <span className="text-left">السعر</span>
                    </div>

                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[1fr_80px_120px] border-t border-white/10 px-4 py-3 text-sm"
                        >
                          <span className="font-bold">{itemName(item)}</span>
                          <span className="text-center text-zinc-300">
                            {itemQty(item)}
                          </span>
                          <span className="text-left text-zinc-300">
                            {money(itemPrice(item))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="border-t border-white/10 p-4 text-sm text-zinc-400">
                        الطلب موجود، لكن ما لقينا items/cart داخله.
                      </div>
                    )}
                  </div>

                  <details className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-zinc-300">
                      بيانات Firestore الخام
                    </summary>

                    <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap text-left text-xs text-zinc-400" dir="ltr">
                      {JSON.stringify(order, null, 2)}
                    </pre>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
