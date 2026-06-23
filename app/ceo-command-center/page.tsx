"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  customerName?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
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

export default function CEOCommandCenterPage() {
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

  const topDrivers = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.driverName || "غير محدد",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const dangerCount =
    (activeOrders.length >= 10 ? 1 : 0) +
    (readyOrders.length >= 3 ? 1 : 0) +
    (onlineDrivers.length === 0 ? 1 : 0) +
    (rejectedOrders.length > 0 ? 1 : 0) +
    (appRating > 0 && appRating < 3 ? 1 : 0);

  const systemHealth = useMemo(() => {
    if (dangerCount >= 3) {
      return {
        title: "خطر",
        icon: "🔴",
        color: "text-red-400",
        bg: "bg-red-500/15",
        border: "border-red-500/30",
      };
    }

    if (dangerCount >= 1) {
      return {
        title: "يحتاج متابعة",
        icon: "🟡",
        color: "text-yellow-400",
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
      };
    }

    return {
      title: "ممتاز",
      icon: "🟢",
      color: "text-green-400",
      bg: "bg-green-500/15",
      border: "border-green-500/30",
    };
  }, [dangerCount]);

  const aiDecisions = [
    activeOrders.length >= 10
      ? "🚨 فعّل سائقين إضافيين فوراً بسبب ضغط الطلبات."
      : "✅ ضغط الطلبات تحت السيطرة.",
    readyOrders.length >= 3
      ? "📦 توجد طلبات جاهزة تحتاج توزيع سريع."
      : "✅ لا توجد مشكلة كبيرة بالطلبات الجاهزة.",
    onlineDrivers.length === 0
      ? "🚗 لا يوجد سائقين متصلين، هذا خطر تشغيلي."
      : `🛵 السائقون المتصلون حالياً: ${onlineDrivers.length}.`,
    topRestaurants[0]
      ? `🍽️ ركّز العروض على ${topRestaurants[0].name}.`
      : "🍽️ لا توجد بيانات مطاعم كافية بعد.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            👑 CEO Command Center
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز القيادة النهائي لمنصة فيوز
          </p>
        </div>

        <div
          className={`mt-10 rounded-3xl border ${systemHealth.border} ${systemHealth.bg} p-6 shadow-2xl`}
        >
          <h2 className={`text-4xl font-black ${systemHealth.color}`}>
            {systemHealth.icon} صحة النظام: {systemHealth.title}
          </h2>

          <p className="mt-3 text-slate-300">
            يتم تقييم صحة المنصة حسب الطلبات، السائقين، الإيرادات، والتقييمات.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل الطلبات" value={orders.length} color="text-white" />
          <Stat title="الطلبات النشطة" value={activeOrders.length} color="text-yellow-400" />
          <Stat title="الإيرادات" value={formatMoney(totalRevenue)} color="text-green-400" />
          <Stat title="التقييم" value={`⭐ ${appRating.toFixed(1)}`} color="text-purple-400" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="سائقين متصلين" value={onlineDrivers.length} color="text-blue-400" />
          <Stat title="سائقين مع GPS" value={driversWithGps.length} color="text-cyan-400" />
          <Stat title="طلبات جاهزة" value={readyOrders.length} color="text-orange-400" />
          <Stat title="تنبيهات خطر" value={dangerCount} color="text-red-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              🧠 قرارات CEO AI
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
              📋 Executive Summary
            </h2>

            <div className="mt-6 space-y-4">
              <Mini label="أفضل مطعم" value={topRestaurants[0]?.name || "غير محدد"} />
              <Mini label="أفضل سائق" value={topDrivers[0]?.name || "غير محدد"} />
              <Mini label="طلبات مسلّمة" value={deliveredOrders.length} />
              <Mini label="طلبات مرفوضة" value={rejectedOrders.length} />
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

function Mini({
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