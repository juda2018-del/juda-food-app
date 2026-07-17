 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type OrderItem = {
  name?: string;
  qty?: number;
  quantity?: number;
  price?: number;
};

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
  items?: OrderItem[];
};

type Rating = {
  id: string;
  restaurant?: string;
  driverName?: string;
  driverRating?: number;
  restaurantRating?: number;
  createdAt?: number;
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

function isThisMonth(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
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

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-IQ");
}

function buildTopList(items: { name: string; value: number }[]) {
  const map: Record<string, number> = {};

  items.forEach((item) => {
    const name = item.name || "غير محدد";
    map[name] = (map[name] || 0) + item.value;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function getHour(createdAt: any) {
  const date = toDate(createdAt);
  if (!date) return "غير محدد";

  return `${date.getHours()}:00`;
}

function calcPercent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Rating[];

      setRatings(data);
    });

    return () => unsub();
  }, []);

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

  const newOrders = orders.filter(
    (order) => order.status === "جديد" || !order.status
  );

  const todayDelivered = deliveredOrders.filter((order) =>
    isToday(order.createdAt)
  );

  const weekDelivered = deliveredOrders.filter((order) =>
    isThisWeek(order.createdAt)
  );

  const monthDelivered = deliveredOrders.filter((order) =>
    isThisMonth(order.createdAt)
  );

  const todaySales = todayDelivered.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const weekSales = weekDelivered.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const monthSales = monthDelivered.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const allSales = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const averageOrderValue =
    deliveredOrders.length === 0
      ? 0
      : Math.round(allSales / deliveredOrders.length);

  const successRate = calcPercent(deliveredOrders.length, orders.length);
  const rejectionRate = calcPercent(rejectedOrders.length, orders.length);

  const expectedTodaySales = Math.round(
    (todaySales / Math.max(todayDelivered.length, 1)) *
      Math.max(orders.filter((order) => isToday(order.createdAt)).length, 1)
  );

  const expectedTodayOrders = Math.max(
    todayDelivered.length,
    orders.filter((order) => isToday(order.createdAt)).length
  );

  const topRestaurants = useMemo(() => {
    return buildTopList(
      deliveredOrders.map((order) => ({
        name: order.restaurant || "غير محدد",
        value: Number(order.total || 0),
      }))
    );
  }, [deliveredOrders]);

  const topDrivers = useMemo(() => {
    return buildTopList(
      deliveredOrders.map((order) => ({
        name: order.driverName || "غير محدد",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const topCustomers = useMemo(() => {
    return buildTopList(
      deliveredOrders.map((order) => ({
        name: order.customerName || order.phone || "زبون",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const topMeals = useMemo(() => {
    const meals: { name: string; value: number }[] = [];

    deliveredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        meals.push({
          name: item.name || "وجبة",
          value: item.qty || item.quantity || 1,
        });
      });
    });

    return buildTopList(meals);
  }, [deliveredOrders]);

  const rushHours = useMemo(() => {
    return buildTopList(
      deliveredOrders.map((order) => ({
        name: getHour(order.createdAt),
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const driverRating = average(
    ratings
      .map((rating) => Number(rating.driverRating || 0))
      .filter((value) => value > 0)
  );

  const restaurantRating = average(
    ratings
      .map((rating) => Number(rating.restaurantRating || 0))
      .filter((value) => value > 0)
  );

  const appRating = average([
    ...ratings
      .map((rating) => Number(rating.driverRating || 0))
      .filter((value) => value > 0),
    ...ratings
      .map((rating) => Number(rating.restaurantRating || 0))
      .filter((value) => value > 0),
  ]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            📈 Analytics Center
          </h1>

          <p className="mt-3 text-slate-400 text-lg">
            مبيعات، طلبات، مطاعم، سائقين، تقييمات، وساعات الذروة
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="مبيعات اليوم" value={`${formatNumber(todaySales)} د.ع`} color="text-green-400" />
          <StatCard title="مبيعات الأسبوع" value={`${formatNumber(weekSales)} د.ع`} color="text-green-400" />
          <StatCard title="مبيعات الشهر" value={`${formatNumber(monthSales)} د.ع`} color="text-green-400" />
          <StatCard title="كل المبيعات" value={`${formatNumber(allSales)} د.ع`} color="text-yellow-400" />

          <StatCard title="طلبات اليوم" value={orders.filter((order) => isToday(order.createdAt)).length} color="text-blue-400" />
          <StatCard title="طلبات جديدة" value={newOrders.length} color="text-cyan-400" />
          <StatCard title="طلبات نشطة" value={activeOrders.length} color="text-yellow-400" />
          <StatCard title="مرفوضة" value={rejectedOrders.length} color="text-red-400" />

          <StatCard title="معدل النجاح" value={`${successRate}%`} color="text-green-400" />
          <StatCard title="معدل الرفض" value={`${rejectionRate}%`} color="text-red-400" />
          <StatCard title="متوسط الطلب" value={`${formatNumber(averageOrderValue)} د.ع`} color="text-purple-400" />
          <StatCard title="تقييم التطبيق" value={`⭐ ${appRating.toFixed(1)}`} color="text-yellow-400" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <ListCard title="🍽️ أكثر المطاعم مبيعاً" data={topRestaurants} suffix="د.ع" money />
          <ListCard title="🚗 أفضل السائقين حسب الطلبات" data={topDrivers} suffix="طلب" />
          <ListCard title="⭐ أكثر الزبائن طلباً" data={topCustomers} suffix="طلب" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ListCard title="🥇 أكثر الوجبات طلباً" data={topMeals} suffix="مرة" />
          <ListCard title="🔥 ساعات الذروة" data={rushHours} suffix="طلب" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <AiCard
            title="🧠 توقع مبيعات اليوم"
            value={`${formatNumber(expectedTodaySales)} د.ع`}
            desc="توقع تقريبي حسب معدل الطلبات الحالية."
          />

          <AiCard
            title="📦 توقع طلبات اليوم"
            value={expectedTodayOrders}
            desc="عدد تقريبي مبني على الطلبات المسجلة اليوم."
          />

          <AiCard
            title="⭐ تقييمات الخدمة"
            value={`سائق ${driverRating.toFixed(1)} / مطعم ${restaurantRating.toFixed(1)}`}
            desc="راقب أي هبوط بالتقييم أقل من 3 نجوم."
          />
        </div>

        <div className="mt-8 rounded-3xl bg-yellow-400 p-6 text-center text-black shadow-2xl">
          <p className="text-sm font-bold">اقتراح ذكي</p>

          <h2 className="mt-2 text-3xl font-black">
            {rushHours[0]
              ? `أكثر ضغط عندك بحدود الساعة ${rushHours[0].name}`
              : "بعد ماكو بيانات كافية للتحليل"}
          </h2>

          <p className="mt-2 font-bold">
            إذا زادت الطلبات بهذا الوقت، جهّز سائقين أكثر ومطاعم أسرع.
          </p>
        </div>

      </section>
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
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 text-center shadow-xl">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function ListCard({
  title,
  data,
  suffix,
  money,
}: {
  title: string;
  data: { name: string; value: number }[];
  suffix: string;
  money?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 text-white shadow-xl">
      <h2 className="mb-4 text-2xl font-black text-yellow-400">{title}</h2>

      {data.length === 0 ? (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 text-center text-slate-400">
          لا توجد بيانات حالياً
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.slice(0, 7).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between rounded-2xl bg-slate-950 border border-slate-800 p-4"
            >
              <div>
                <p className="text-lg font-black">
                  #{index + 1} {item.name}
                </p>
              </div>

              <div className="rounded-full bg-yellow-400 px-4 py-2 font-black text-black">
                {money ? formatNumber(item.value) : item.value} {suffix}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AiCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string | number;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
      <h2 className="text-xl font-black text-purple-400">{title}</h2>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-3 text-slate-400">{desc}</p>
    </div>
  );
}