"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  status?: string;
  restaurant?: string;
  total?: number;
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

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function SystemMonitorPage() {
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

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
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

  const appRating = average([
    ...ratings
      .map((item) => Number(item.driverRating || 0))
      .filter((value) => value > 0),
    ...ratings
      .map((item) => Number(item.restaurantRating || 0))
      .filter((value) => value > 0),
  ]);

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

  const systemAlerts = [
    activeOrders.length >= 10
      ? "🚨 ضغط عالي على الطلبات النشطة."
      : "✅ الطلبات النشطة تحت السيطرة.",
    readyOrders.length >= 3
      ? "📦 توجد طلبات جاهزة تحتاج توزيع سريع."
      : "✅ الطلبات الجاهزة ضمن الطبيعي.",
    onlineDrivers.length === 0
      ? "🚗 لا يوجد سائقين متصلين حالياً."
      : `🛵 السائقين المتصلين: ${onlineDrivers.length}.`,
    driversWithGps.length < onlineDrivers.length
      ? "📍 بعض السائقين متصلين بدون GPS."
      : "✅ مواقع السائقين تعمل بشكل جيد.",
    appRating > 0 && appRating < 3
      ? "⭐ التقييمات منخفضة وتحتاج متابعة."
      : "✅ التقييمات مستقرة.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🖥️ System Monitor
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز مراقبة النظام الحي لمنصة فيوز
          </p>
        </div>

        <div
          className={`mt-10 rounded-3xl border ${systemHealth.border} ${systemHealth.bg} p-6 shadow-2xl`}
        >
          <h2 className={`text-4xl font-black ${systemHealth.color}`}>
            {systemHealth.icon} صحة النظام: {systemHealth.title}
          </h2>

          <p className="mt-3 text-slate-300">
            يتم حساب صحة النظام حسب الطلبات، السائقين، GPS، التقييمات، والتنبيهات.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل الطلبات" value={orders.length} color="text-white" />
          <Stat title="النشطة" value={activeOrders.length} color="text-yellow-400" />
          <Stat title="المسلّمة" value={deliveredOrders.length} color="text-green-400" />
          <Stat title="المرفوضة" value={rejectedOrders.length} color="text-red-400" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل السائقين" value={drivers.length} color="text-white" />
          <Stat title="متصلين" value={onlineDrivers.length} color="text-green-400" />
          <Stat title="مع GPS" value={driversWithGps.length} color="text-cyan-400" />
          <Stat title="التقييم" value={`⭐ ${appRating.toFixed(1)}`} color="text-purple-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              ⚠️ تنبيهات النظام
            </h2>

            <div className="mt-6 space-y-4">
              {systemAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-lg"
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-purple-400">
              🤖 System AI
            </h2>

            <div className="mt-6 space-y-4">
              <Box label="مستوى الخطر" value={dangerCount} />
              <Box label="طلبات جاهزة" value={readyOrders.length} />
              <Box label="GPS فعال" value={`${driversWithGps.length}/${onlineDrivers.length}`} />
              <Box
                label="قرار سريع"
                value={
                  dangerCount >= 2
                    ? "تدخل إداري الآن"
                    : "النظام مستقر"
                }
              />
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
      <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
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