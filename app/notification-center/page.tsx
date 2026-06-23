"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  customerName?: string;
  restaurant?: string;
  status?: string;
  driverName?: string;
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
  restaurant?: string;
  driverName?: string;
  driverRating?: number;
  restaurantRating?: number;
  comment?: string;
};

type Notice = {
  id: string;
  title: string;
  desc: string;
  type: "orders" | "drivers" | "restaurants" | "ratings" | "danger" | "ai";
  level: "info" | "success" | "warning" | "danger";
};

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

export default function NotificationCenterPage() {
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

  const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

  const readyOrders = orders.filter(
    (order) => order.status === "جاهز" || order.status === "جاهز للتوصيل"
  );

  const onlineDrivers = drivers.filter((driver) => isOnline(driver));

  const driversWithoutGps = onlineDrivers.filter(
    (driver) =>
      typeof driver.latitude !== "number" ||
      typeof driver.longitude !== "number"
  );

  const weakRatings = ratings.filter(
    (rating) =>
      Number(rating.driverRating || 0) <= 2 ||
      Number(rating.restaurantRating || 0) <= 2
  );

  const notifications = useMemo<Notice[]>(() => {
    const list: Notice[] = [];

    if (readyOrders.length > 0) {
      list.push({
        id: "ready-orders",
        title: "📦 طلبات جاهزة للتوصيل",
        desc: `يوجد ${readyOrders.length} طلب جاهز يحتاج سائق.`,
        type: "orders",
        level: "warning",
      });
    }

    if (activeOrders.length >= 10) {
      list.push({
        id: "high-orders",
        title: "🚨 ضغط مرتفع على الطلبات",
        desc: `يوجد ${activeOrders.length} طلب نشط حالياً.`,
        type: "danger",
        level: "danger",
      });
    }

    if (onlineDrivers.length === 0) {
      list.push({
        id: "no-drivers",
        title: "🚗 لا يوجد سائقين متصلين",
        desc: "يجب تشغيل سائقين فوراً حتى لا تتأخر الطلبات.",
        type: "drivers",
        level: "danger",
      });
    }

    if (driversWithoutGps.length > 0) {
      list.push({
        id: "gps-warning",
        title: "📍 سائقين بدون GPS",
        desc: `${driversWithoutGps.length} سائق متصل بدون موقع مباشر.`,
        type: "drivers",
        level: "warning",
      });
    }

    if (rejectedOrders.length > 0) {
      list.push({
        id: "rejected-orders",
        title: "❌ طلبات مرفوضة",
        desc: `يوجد ${rejectedOrders.length} طلب مرفوض يحتاج مراجعة.`,
        type: "orders",
        level: "warning",
      });
    }

    if (weakRatings.length > 0) {
      list.push({
        id: "weak-ratings",
        title: "⭐ تقييمات ضعيفة",
        desc: `يوجد ${weakRatings.length} تقييم ضعيف يحتاج متابعة.`,
        type: "ratings",
        level: "danger",
      });
    }

    list.push({
      id: "ai-suggestion",
      title: "🤖 Notification AI",
      desc:
        activeOrders.length >= 10
          ? "النظام يقترح تفعيل سائقين إضافيين وتقليل وقت التحضير."
          : "الوضع مستقر، راقب الطلبات الجاهزة والتقييمات.",
      type: "ai",
      level: "info",
    });

    return list;
  }, [
    readyOrders.length,
    activeOrders.length,
    onlineDrivers.length,
    driversWithoutGps.length,
    rejectedOrders.length,
    weakRatings.length,
  ]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🔔 Notification Center
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز الإشعارات والتنبيهات الذكية في فيوز
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="كل الإشعارات" value={notifications.length} color="text-white" />
          <Stat title="طلبات نشطة" value={activeOrders.length} color="text-yellow-400" />
          <Stat title="سائقين متصلين" value={onlineDrivers.length} color="text-green-400" />
          <Stat title="تقييمات ضعيفة" value={weakRatings.length} color="text-red-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              🚨 التنبيهات المباشرة
            </h2>

            <div className="mt-6 space-y-4">
              {notifications.map((item) => (
                <NoticeCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-purple-400">
              🤖 Notification AI
            </h2>

            <div className="mt-6 space-y-4">
              <AiBox title="أولوية اليوم" value="راقب الطلبات الجاهزة للتوصيل" />
              <AiBox title="الخطر الأعلى" value={weakRatings.length > 0 ? "التقييمات الضعيفة" : "لا يوجد خطر عالي"} />
              <AiBox title="اقتراح" value="فعّل إشعارات فورية للمطعم والسائق والعميل" />
              <AiBox title="القرار السريع" value={onlineDrivers.length === 0 ? "شغّل سائقين فوراً" : "الوضع مقبول"} />
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

function NoticeCard({ item }: { item: Notice }) {
  const style =
    item.level === "danger"
      ? "bg-red-500/15 border-red-500/30 text-red-100"
      : item.level === "warning"
      ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-100"
      : item.level === "success"
      ? "bg-green-500/15 border-green-500/30 text-green-100"
      : "bg-blue-500/15 border-blue-500/30 text-blue-100";

  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <h3 className="text-xl font-black">{item.title}</h3>
      <p className="mt-2 leading-8">{item.desc}</p>
    </div>
  );
}

function AiBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
      <p className="text-slate-400">{title}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}