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

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function money(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

export default function OperationsCenterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

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

  const newOrders = orders.filter(
    (order) => order.status === "جديد" || !order.status
  );

  const preparingOrders = orders.filter(
    (order) => order.status === "قيد التحضير"
  );

  const readyOrders = orders.filter(
    (order) => order.status === "جاهز" || order.status === "جاهز للتوصيل"
  );

  const onWayOrders = orders.filter(
    (order) =>
      order.status === "السائق بالطريق" ||
      order.status === "السائق استلم الطلب"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const onlineDrivers = drivers.filter((driver) => isOnline(driver));

  const gpsDrivers = onlineDrivers.filter(
    (driver) =>
      typeof driver.latitude === "number" &&
      typeof driver.longitude === "number"
  );

  const cityPressure = useMemo(() => {
    if (activeOrders.length >= 20 || readyOrders.length >= 7) {
      return {
        title: "ضغط عالي",
        color: "text-red-400",
        bg: "bg-red-500/15",
        border: "border-red-500/30",
      };
    }

    if (activeOrders.length >= 10 || readyOrders.length >= 3) {
      return {
        title: "ضغط متوسط",
        color: "text-yellow-400",
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
      };
    }

    return {
      title: "طبيعي",
      color: "text-green-400",
      bg: "bg-green-500/15",
      border: "border-green-500/30",
    };
  }, [activeOrders.length, readyOrders.length]);

  const aiDecisions = [
    readyOrders.length >= 3
      ? "📦 وزّع الطلبات الجاهزة فوراً على السائقين المتصلين."
      : "✅ الطلبات الجاهزة تحت السيطرة.",
    onlineDrivers.length < 3
      ? "🚗 عدد السائقين قليل، فعّل سائقين احتياط."
      : "🛵 عدد السائقين المتصلين جيد.",
    gpsDrivers.length < onlineDrivers.length
      ? "📍 بعض السائقين بدون GPS، راقب التتبع."
      : "✅ GPS السائقين جيد.",
    activeOrders.length >= 10
      ? "🔥 ضغط العمليات مرتفع، راقب المطاعم والطلبات المتأخرة."
      : "✅ العمليات مستقرة حالياً.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🔥 Operations Center
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            مركز العمليات المباشر لمنصة فيوز
          </p>
        </div>

        <div
          className={`mt-10 rounded-3xl border ${cityPressure.border} ${cityPressure.bg} p-6 shadow-2xl`}
        >
          <h2 className={`text-4xl font-black ${cityPressure.color}`}>
            🔥 ضغط المدينة: {cityPressure.title}
          </h2>

          <p className="mt-3 text-slate-300">
            يتم احتساب الضغط حسب الطلبات النشطة والطلبات الجاهزة.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="طلبات جديدة" value={newOrders.length} color="text-cyan-400" />
          <Stat title="قيد التحضير" value={preparingOrders.length} color="text-yellow-400" />
          <Stat title="جاهزة للتوصيل" value={readyOrders.length} color="text-orange-400" />
          <Stat title="بالطريق" value={onWayOrders.length} color="text-blue-400" />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="تم التسليم" value={deliveredOrders.length} color="text-green-400" />
          <Stat title="مرفوضة" value={rejectedOrders.length} color="text-red-400" />
          <Stat title="سائقين متصلين" value={onlineDrivers.length} color="text-purple-400" />
          <Stat title="GPS فعال" value={`${gpsDrivers.length}/${onlineDrivers.length}`} color="text-teal-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              📦 الطلبات الحية
            </h2>

            <div className="mt-6 space-y-4">
              {activeOrders.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  لا توجد طلبات نشطة حالياً
                </div>
              ) : (
                activeOrders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          #{order.id} - {order.restaurant || "مطعم"}
                        </h3>

                        <p className="text-slate-400 mt-1">
                          👤 {order.customerName || "زبون"} | 🚗{" "}
                          {order.driverName || "بدون سائق"}
                        </p>
                      </div>

                      <div className="text-left">
                        <p className="text-yellow-400 font-black">
                          {order.status || "جديد"}
                        </p>

                        <p className="text-green-400 font-black mt-1">
                          {money(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-purple-400">
              🤖 Operations AI
            </h2>

            <div className="mt-6 space-y-4">
              {aiDecisions.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100"
                >
                  {item}
                </div>
              ))}
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