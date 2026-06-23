"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  lastSeen?: number;
  rating?: number;
};

type Order = {
  id: string;
  customerName?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverId?: string;
  driverName?: string;
  restaurantLat?: number;
  restaurantLng?: number;
  createdAt?: any;
};

const defaultRestaurantLocation = {
  lat: 33.2965,
  lng: 44.4445,
};

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function hasGps(driver: Driver) {
  return (
    typeof driver.latitude === "number" &&
    typeof driver.longitude === "number"
  );
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function dispatchScore(driver: Driver, distance: number) {
  let score = 100;

  score -= distance * 8;

  if (driver.lastSeen) {
    const minutes = (Date.now() - driver.lastSeen) / 1000 / 60;
    score -= minutes * 3;
  } else {
    score -= 15;
  }

  if (driver.accuracy && driver.accuracy > 50) score -= 8;
  if (driver.accuracy && driver.accuracy > 100) score -= 12;

  if (driver.rating) score += driver.rating * 2;

  return Math.max(1, Math.min(100, Math.round(score)));
}

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function formatTime(value?: number) {
  if (!value) return "لا يوجد تحديث";
  return new Date(value).toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AutoDispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data);

      const firstReady = data.find(
        (order) =>
          (order.status === "جاهز" || order.status === "جاهز للتوصيل") &&
          !order.driverId
      );

      if (!selectedOrderId && firstReady) {
        setSelectedOrderId(firstReady.id);
      }
    });

    return () => unsub();
  }, [selectedOrderId]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

  const readyOrders = orders.filter(
    (order) =>
      (order.status === "جاهز" || order.status === "جاهز للتوصيل") &&
      !order.driverId
  );

  const selectedOrder =
    readyOrders.find((order) => order.id === selectedOrderId) || readyOrders[0];

  const rankedDrivers = useMemo(() => {
    if (!selectedOrder) return [];

    const restaurantLat =
      selectedOrder.restaurantLat || defaultRestaurantLocation.lat;
    const restaurantLng =
      selectedOrder.restaurantLng || defaultRestaurantLocation.lng;

    return drivers
      .filter((driver) => isOnline(driver) && hasGps(driver))
      .map((driver) => {
        const distance = distanceKm(
          restaurantLat,
          restaurantLng,
          Number(driver.latitude),
          Number(driver.longitude)
        );

        return {
          ...driver,
          distance,
          score: dispatchScore(driver, distance),
          eta: Math.max(4, Math.round(distance * 5 + 3)),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distance - b.distance;
      });
  }, [drivers, selectedOrder]);

  const bestDriver = rankedDrivers[0];

  async function assignBestDriver() {
    if (!selectedOrder || !bestDriver) {
      alert("لا يوجد طلب جاهز أو سائق مناسب حالياً");
      return;
    }

    setIsAssigning(true);

    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        status: "تم تعيين سائق",
        driverId: bestDriver.id,
        driverName: bestDriver.name || bestDriver.id,
        driverPhone: bestDriver.phone || "",
        assignedAt: Date.now(),
        dispatchScore: bestDriver.score,
        dispatchDistanceKm: Number(bestDriver.distance.toFixed(2)),
      });

      await addDoc(collection(db, "notifications"), {
        title: "🛵 طلب جديد قريب منك",
        body: `تم تعيين طلب من ${selectedOrder.restaurant || "مطعم"} إلى ${
          bestDriver.name || bestDriver.id
        }`,
        type: "driver",
        target: "driver",
        driverId: bestDriver.id,
        orderId: selectedOrder.id,
        isRead: false,
        createdAt: Date.now(),
      });

      await addDoc(collection(db, "notifications"), {
        title: "🤖 Auto Dispatch",
        body: `تم تعيين السائق ${
          bestDriver.name || bestDriver.id
        } للطلب ${selectedOrder.id} تلقائياً.`,
        type: "ai",
        target: "admin",
        orderId: selectedOrder.id,
        isRead: false,
        createdAt: Date.now(),
      });

      alert("تم توزيع الطلب تلقائياً بنجاح");
    } catch (error) {
      console.error(error);
      alert("صار خطأ أثناء توزيع الطلب");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🛵 Auto Dispatch AI
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            توزيع الطلبات تلقائياً على أفضل سائق حسب GPS والذكاء التشغيلي
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <Stat title="طلبات جاهزة" value={readyOrders.length} color="text-yellow-400" />
          <Stat title="سائقين متاحين" value={rankedDrivers.length} color="text-green-400" />
          <Stat title="أفضل Score" value={bestDriver ? `${bestDriver.score}/100` : "0"} color="text-purple-400" />
          <Stat title="أقرب مسافة" value={bestDriver ? `${bestDriver.distance.toFixed(2)} كم` : "لا يوجد"} color="text-cyan-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-yellow-400">
              📦 الطلبات الجاهزة
            </h2>

            <div className="mt-6 space-y-4">
              {readyOrders.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
                  لا توجد طلبات جاهزة للتوزيع
                </div>
              ) : (
                readyOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-right rounded-2xl border p-5 duration-300 ${
                      selectedOrder?.id === order.id
                        ? "bg-yellow-400 text-black border-yellow-300"
                        : "bg-slate-950 text-white border-slate-800 hover:border-yellow-400"
                    }`}
                  >
                    <h3 className="text-xl font-black">#{order.id}</h3>
                    <p className="mt-2">
                      🍽️ {order.restaurant || "مطعم"} — 👤{" "}
                      {order.customerName || "زبون"}
                    </p>
                    <p className="mt-2 font-black">
                      💰 {formatMoney(order.total)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black text-green-400">
              🚗 السائق الأفضل
            </h2>

            {!selectedOrder ? (
              <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                اختر طلب جاهز حتى يظهر أفضل سائق
              </div>
            ) : bestDriver ? (
              <div className="mt-6 bg-yellow-400 rounded-3xl p-8 text-black text-center">
                <p className="font-black opacity-80">
                  الطلب المختار: #{selectedOrder.id}
                </p>

                <h3 className="mt-3 text-5xl font-black">
                  {bestDriver.name || bestDriver.id}
                </h3>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Mini label="المسافة" value={`${bestDriver.distance.toFixed(2)} كم`} />
                  <Mini label="الوصول" value={`${bestDriver.eta} دقيقة`} />
                  <Mini label="AI Score" value={`${bestDriver.score}/100`} />
                  <Mini label="التقييم" value={`⭐ ${bestDriver.rating || 0}`} />
                </div>

                <p className="mt-5">
                  🎯 دقة GPS:{" "}
                  {bestDriver.accuracy
                    ? `${Math.round(bestDriver.accuracy)} متر`
                    : "غير محددة"}
                </p>

                <p className="mt-2">
                  🕒 آخر تحديث: {formatTime(bestDriver.lastSeen)}
                </p>

                <button
                  onClick={assignBestDriver}
                  disabled={isAssigning}
                  className="mt-6 w-full rounded-2xl bg-black py-5 text-xl font-black text-white disabled:opacity-50"
                >
                  {isAssigning ? "جاري التوزيع..." : "🤖 وزّع الطلب تلقائياً"}
                </button>
              </div>
            ) : (
              <div className="mt-6 bg-red-500/15 border border-red-500/30 rounded-2xl p-8 text-center text-red-300 font-black">
                لا يوجد سائق متصل مع GPS حالياً
              </div>
            )}
          </div>

        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-3xl font-black text-purple-400">
            ⚡ ترتيب السائقين
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedDrivers.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 md:col-span-2">
                لا توجد بيانات سائقين حالياً
              </div>
            ) : (
              rankedDrivers.slice(0, 10).map((driver, index) => (
                <div
                  key={driver.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between gap-4">
                    <h3 className="text-xl font-black">
                      #{index + 1} {driver.name || driver.id}
                    </h3>

                    <span className="text-yellow-400 font-black">
                      {driver.score}/100
                    </span>
                  </div>

                  <p className="mt-3 text-slate-300">
                    📍 {driver.distance.toFixed(2)} كم — ⏱️ {driver.eta} دقيقة
                  </p>

                  <p className="mt-2 text-slate-400">
                    🕒 {formatTime(driver.lastSeen)}
                  </p>
                </div>
              ))
            )}
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
    <div className="bg-black/10 rounded-2xl p-4">
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}