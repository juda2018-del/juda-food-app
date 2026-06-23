"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

function toDate(value: any) {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") return value.toDate();

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}

function isToday(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
}

function isThisMonth(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function calcPercent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function buildTopRestaurants(orders: Order[]) {
  const map: Record<string, number> = {};

  orders.forEach((order) => {
    const name = order.restaurant || "غير محدد";
    map[name] = (map[name] || 0) + Number(order.total || 0);
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default function RevenueCenterPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, []);

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const todayOrders = deliveredOrders.filter((order) =>
    isToday(order.createdAt)
  );

  const weekOrders = deliveredOrders.filter((order) =>
    isThisWeek(order.createdAt)
  );

  const monthOrders = deliveredOrders.filter((order) =>
    isThisMonth(order.createdAt)
  );

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const weekRevenue = weekOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const monthRevenue = monthOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const averageOrderValue =
    deliveredOrders.length === 0
      ? 0
      : Math.round(totalRevenue / deliveredOrders.length);

  const topRestaurants = useMemo(() => {
    return buildTopRestaurants(deliveredOrders);
  }, [deliveredOrders]);

  const bestRestaurant = topRestaurants[0];

  const todayShare = calcPercent(todayRevenue, totalRevenue);
  const weekShare = calcPercent(weekRevenue, totalRevenue);
  const monthShare = calcPercent(monthRevenue, totalRevenue);

  const expectedTodayRevenue = Math.round(
    (todayRevenue / Math.max(todayOrders.length, 1)) *
      Math.max(orders.filter((order) => isToday(order.createdAt)).length, 1)
  );

  const expectedMonthRevenue = Math.round(
    (monthRevenue / Math.max(new Date().getDate(), 1)) * 30
  );

  const revenueHealth = useMemo(() => {
    if (todayRevenue >= 1000000 || monthRevenue >= 20000000) {
      return {
        title: "ممتاز",
        icon: "🟢",
        color: "text-green-400",
        bg: "bg-green-500/15",
        border: "border-green-500/30",
      };
    }

    if (todayRevenue >= 300000 || monthRevenue >= 5000000) {
      return {
        title: "جيد",
        icon: "🟡",
        color: "text-yellow-400",
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
      };
    }

    if (deliveredOrders.length > 0) {
      return {
        title: "يحتاج متابعة",
        icon: "🟠",
        color: "text-orange-400",
        bg: "bg-orange-500/15",
        border: "border-orange-500/30",
      };
    }

    return {
      title: "لا توجد بيانات كافية",
      icon: "⚪",
      color: "text-slate-300",
      bg: "bg-slate-900",
      border: "border-slate-800",
    };
  }, [todayRevenue, monthRevenue, deliveredOrders.length]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            💰 Revenue Center
          </h1>

          <p className="mt-3 text-slate-400 text-lg">
            مركز الإيرادات والأرباح لفيوز
          </p>
        </div>

        <div
          className={`mt-10 rounded-3xl border ${revenueHealth.border} ${revenueHealth.bg} p-6 shadow-2xl`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className={`text-4xl font-black ${revenueHealth.color}`}>
                {revenueHealth.icon} صحة الإيرادات: {revenueHealth.title}
              </h2>

              <p className="mt-3 text-slate-300">
                يتم حساب الحالة حسب إيرادات اليوم والشهر.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 px-6 py-4 text-center">
              <p className="text-slate-400">إجمالي الإيرادات</p>
              <p className="text-3xl font-black text-yellow-400 mt-2">
                {formatMoney(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <StatCard title="إيرادات اليوم" value={formatMoney(todayRevenue)} color="text-green-400" />
          <StatCard title="إيرادات الأسبوع" value={formatMoney(weekRevenue)} color="text-blue-400" />
          <StatCard title="إيرادات الشهر" value={formatMoney(monthRevenue)} color="text-purple-400" />
          <StatCard title="كل الإيرادات" value={formatMoney(totalRevenue)} color="text-yellow-400" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <StatCard title="طلبات مدفوعة" value={deliveredOrders.length} color="text-cyan-400" />
          <StatCard title="متوسط قيمة الطلب" value={formatMoney(averageOrderValue)} color="text-orange-400" />
          <StatCard title="حصة اليوم" value={`${todayShare}%`} color="text-green-400" />
          <StatCard title="حصة الشهر" value={`${monthShare}%`} color="text-purple-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-3xl font-black text-yellow-400">
              🍽️ أعلى المطاعم دخلاً
            </h2>

            <div className="mt-6 space-y-4">
              {topRestaurants.length === 0 ? (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center text-slate-400">
                  لا توجد إيرادات حالياً
                </div>
              ) : (
                topRestaurants.slice(0, 8).map((item, index) => {
                  const percent = calcPercent(item.value, totalRevenue);

                  return (
                    <div
                      key={item.name}
                      className="rounded-2xl bg-slate-950 border border-slate-800 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <h3 className="font-black text-lg">
                          #{index + 1} {item.name}
                        </h3>

                        <span className="font-black text-yellow-400">
                          {formatMoney(item.value)}
                        </span>
                      </div>

                      <div className="mt-3 h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <p className="mt-2 text-sm text-slate-400">
                        نسبة من الإيرادات: {percent}%
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-3xl font-black text-purple-400">
              🚀 توقعات AI
            </h2>

            <div className="mt-6 space-y-4">
              <AiBox
                title="توقع نهاية اليوم"
                value={formatMoney(expectedTodayRevenue)}
              />

              <AiBox
                title="توقع نهاية الشهر"
                value={formatMoney(expectedMonthRevenue)}
              />

              <AiBox
                title="أفضل مطعم للإعلانات"
                value={bestRestaurant?.name || "غير محدد"}
              />

              <AiBox
                title="حصة الأسبوع"
                value={`${weekShare}% من الكل`}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-yellow-400 p-6 text-center text-black shadow-2xl">
          <p className="text-sm font-bold">اقتراح رفع الإيرادات</p>

          <h2 className="mt-2 text-3xl font-black">
            {bestRestaurant
              ? `سوِّ عرض سريع مع ${bestRestaurant.name} لأن دخله الأعلى حالياً`
              : "بعد ماكو بيانات كافية للتوصية"}
          </h2>

          <p className="mt-2 font-bold">
            ركز العروض وقت الذروة وارفع ظهور المطاعم الأعلى دخلاً.
          </p>
        </div>

      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 text-center shadow-xl">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function AiBox({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
      <p className="text-slate-400">{title}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}