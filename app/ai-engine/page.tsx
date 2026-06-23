"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  address?: string;
  area?: string;
  createdAt?: any;
};

type Driver = {
  id: string;
  name?: string;
  status?: string;
  lastSeen?: number;
  latitude?: number;
  longitude?: number;
};

type Rating = {
  id: string;
  driverRating?: number;
  restaurantRating?: number;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topList(items: { name: string; value: number }[]) {
  const map: Record<string, number> = {};

  items.forEach((item) => {
    const name = item.name || "غير محدد";
    map[name] = (map[name] || 0) + item.value;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default function AIEnginePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Order[]
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      setDrivers(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Driver[]
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      setRatings(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Rating[]
      );
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

  const readyOrders = orders.filter(
    (order) => order.status === "جاهز" || order.status === "جاهز للتوصيل"
  );

  const onlineDrivers = drivers.filter((driver) => isOnline(driver));

  const driversWithGps = onlineDrivers.filter(
    (driver) =>
      typeof driver.latitude === "number" &&
      typeof driver.longitude === "number"
  );

  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const appRating = average([
    ...ratings
      .map((item) => Number(item.driverRating || 0))
      .filter((value) => value > 0),
    ...ratings
      .map((item) => Number(item.restaurantRating || 0))
      .filter((value) => value > 0),
  ]);

  const topRestaurants = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.restaurant || "غير محدد",
        value: Number(order.total || 0),
      }))
    );
  }, [deliveredOrders]);

  const topAreas = useMemo(() => {
    return topList(
      orders.map((order) => ({
        name: order.area || order.address || "غير محدد",
        value: 1,
      }))
    );
  }, [orders]);

  const expectedRevenue = Math.round(
    (totalRevenue / Math.max(deliveredOrders.length, 1)) *
      Math.max(orders.length, 1)
  );

  const riskLevel =
    activeOrders.length >= 15 ||
    readyOrders.length >= 5 ||
    onlineDrivers.length === 0 ||
    rejectedOrders.length >= 3
      ? "خطر"
      : activeOrders.length >= 8 || readyOrders.length >= 3
      ? "متوسط"
      : "طبيعي";

  const aiDecisions = [
    activeOrders.length >= 10
      ? "🚨 فعّل سائقين إضافيين بسبب ضغط الطلبات."
      : "✅ الطلبات النشطة ضمن السيطرة.",
    readyOrders.length >= 3
      ? "📦 وزّع الطلبات الجاهزة فوراً عبر Dispatch AI."
      : "✅ لا توجد أزمة بالطلبات الجاهزة.",
    topAreas[0]
      ? `🔥 منطقة ${topAreas[0].name} هي الأكثر طلباً حالياً.`
      : "📍 لا توجد بيانات مناطق كافية.",
    topRestaurants[0]
      ? `🍽️ أفضل مطعم للإعلانات حالياً: ${topRestaurants[0].name}.`
      : "🍽️ لا توجد بيانات مطاعم كافية.",
    onlineDrivers.length < 3
      ? "🚗 عدد السائقين المتصلين قليل، شغّل سائقين احتياط."
      : "🛵 عدد السائقين المتصلين جيد.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🧠 Real-Time AI Engine
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            عقل فيوز التشغيلي للتوقعات والقرارات الذكية
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="الطلبات النشطة" value={activeOrders.length} color="text-yellow-400" />
          <Stat title="السائقين المتصلين" value={onlineDrivers.length} color="text-green-400" />
          <Stat title="GPS فعال" value={`${driversWithGps.length}/${onlineDrivers.length}`} color="text-cyan-400" />
          <Stat title="مستوى الخطر" value={riskLevel} color={riskLevel === "خطر" ? "text-red-400" : riskLevel === "متوسط" ? "text-yellow-400" : "text-green-400"} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="الإيرادات" value={formatMoney(totalRevenue)} color="text-green-400" />
          <Stat title="توقع الإيرادات" value={formatMoney(expectedRevenue)} color="text-purple-400" />
          <Stat title="طلبات جاهزة" value={readyOrders.length} color="text-orange-400" />
          <Stat title="التقييم" value={`⭐ ${appRating.toFixed(1)}`} color="text-yellow-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              🤖 AI Decisions
            </h2>

            <div className="mt-6 space-y-4">
              {aiDecisions.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-lg"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-purple-400">
              🔥 Predictive AI
            </h2>

            <div className="mt-6 space-y-4">
              <Box label="أفضل مطعم" value={topRestaurants[0]?.name || "غير محدد"} />
              <Box label="أكثر منطقة طلباً" value={topAreas[0]?.name || "غير محدد"} />
              <Box label="طلبات متوقعة" value={orders.length} />
              <Box label="قرار CEO" value={riskLevel === "خطر" ? "تدخل فوري" : "استمرار المراقبة"} />
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className={`mt-3 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Box({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
      <p className="text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}