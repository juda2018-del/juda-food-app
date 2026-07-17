 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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
};

type PendingOrder = {
  id: string;
  restaurant: string;
  customer: string;
  area: string;
  total: number;
  status: string;
};

const restaurantLocation = {
  name: "فيروز",
  lat: 33.2965,
  lng: 44.4445,
};

const pendingOrders: PendingOrder[] = [
  {
    id: "FUSE-1024",
    restaurant: "فيروز",
    customer: "أحمد علي",
    area: "زيونة",
    total: 18000,
    status: "جاهز للتوصيل",
  },
  {
    id: "FUSE-1025",
    restaurant: "شلتتة",
    customer: "سارة محمد",
    area: "الكرادة",
    total: 22000,
    status: "جاهز للتوصيل",
  },
  {
    id: "FUSE-1026",
    restaurant: "خان قدوري",
    customer: "حسين كريم",
    area: "عرصات",
    total: 35000,
    status: "قيد التحضير",
  },
];

function hasLocation(driver: Driver) {
  return (
    typeof driver.latitude === "number" &&
    typeof driver.longitude === "number"
  );
}

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;

  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
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

function aiScore(distance: number, lastSeen?: number, accuracy?: number) {
  let score = 100;

  score -= distance * 8;

  if (lastSeen) {
    const minutes = (Date.now() - lastSeen) / 1000 / 60;
    score -= minutes * 3;
  } else {
    score -= 15;
  }

  if (accuracy && accuracy > 50) score -= 8;
  if (accuracy && accuracy > 100) score -= 12;

  return Math.max(1, Math.min(100, Math.round(score)));
}

function etaMinutes(distance: number) {
  return Math.max(4, Math.round(distance * 5 + 3));
}

function formatTime(value?: number) {
  if (!value) return "لا يوجد تحديث";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "لا يوجد تحديث";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

export default function DispatchAIPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("FUSE-1024");

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

  const selectedOrder = useMemo(() => {
    return (
      pendingOrders.find((order) => order.id === selectedOrderId) ||
      pendingOrders[0]
    );
  }, [selectedOrderId]);

  const rankedDrivers = useMemo(() => {
    return drivers
      .filter((driver) => isOnline(driver) && hasLocation(driver))
      .map((driver) => {
        const distance = distanceKm(
          restaurantLocation.lat,
          restaurantLocation.lng,
          Number(driver.latitude),
          Number(driver.longitude)
        );

        return {
          ...driver,
          distance,
          score: aiScore(distance, driver.lastSeen, driver.accuracy),
          eta: etaMinutes(distance),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distance - b.distance;
      });
  }, [drivers]);

  const bestDriver = rankedDrivers[0];
  const onlineWithoutGps = drivers.filter(
    (driver) => isOnline(driver) && !hasLocation(driver)
  ).length;

  const openMapUrl = bestDriver
    ? `https://www.google.com/maps?q=${bestDriver.latitude},${bestDriver.longitude}`
    : "https://www.google.com/maps?q=Baghdad,Iraq";

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🧠 Dispatch AI
          </h1>

          <p className="mt-3 text-slate-400 text-lg">
            التوزيع الذكي للطلبات حسب أقرب وأفضل سائق
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-5">
          <InfoCard title="كل السائقين" value={drivers.length} color="text-white" />
          <InfoCard title="متاحين مع GPS" value={rankedDrivers.length} color="text-green-400" />
          <InfoCard title="متصلين بدون GPS" value={onlineWithoutGps} color="text-yellow-400" />
          <InfoCard title="طلبات جاهزة" value={pendingOrders.filter((o) => o.status === "جاهز للتوصيل").length} color="text-blue-400" />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-yellow-400">
              📦 الطلبات المنتظرة
            </h2>

            <div className="mt-5 space-y-4">
              {pendingOrders.map((order) => {
                const isSelected = order.id === selectedOrder.id;

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-right rounded-3xl p-4 border duration-300 ${
                      isSelected
                        ? "bg-yellow-400 text-black border-yellow-300"
                        : "bg-slate-950 text-white border-slate-800 hover:border-yellow-400"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <h3 className="font-black text-xl">#{order.id}</h3>
                      <span className="font-black">{order.status}</span>
                    </div>

                    <p className="mt-2">
                      🍽️ {order.restaurant} — 📍 {order.area}
                    </p>

                    <p className="mt-1">
                      👤 {order.customer} — 💰 {formatMoney(order.total)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl lg:col-span-2">
            <h2 className="text-2xl font-black text-green-400">
              🚗 السائق المقترح تلقائياً
            </h2>

            {bestDriver ? (
              <div className="mt-5 rounded-3xl bg-yellow-400 p-8 text-center text-black">
                <div className="text-sm font-black opacity-80">
                  الطلب المختار: #{selectedOrder.id}
                </div>

                <h3 className="mt-3 text-5xl font-black">
                  {bestDriver.name || bestDriver.id}
                </h3>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                  <div className="rounded-2xl bg-black/10 p-4">
                    📍 المسافة
                    <div className="font-black mt-2">
                      {bestDriver.distance.toFixed(2)} كم
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/10 p-4">
                    ⏱️ الوصول
                    <div className="font-black mt-2">
                      {bestDriver.eta} دقيقة
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/10 p-4">
                    ⭐ AI Score
                    <div className="font-black mt-2">
                      {bestDriver.score}/100
                    </div>
                  </div>
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

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href={openMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl bg-black py-4 font-black text-white"
                  >
                    📍 فتح موقع السائق
                  </a>

                  <button
                    onClick={() =>
                      alert(
                        `تم ترشيح السائق ${bestDriver.name || bestDriver.id} للطلب ${selectedOrder.id}`
                      )
                    }
                    className="rounded-2xl bg-green-600 py-4 font-black text-white"
                  >
                    🤖 توزيع ذكي الآن
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl bg-red-500/15 border border-red-500/30 p-8 text-center font-black text-red-300">
                لا يوجد سائق متصل مع GPS حالياً
              </div>
            )}
          </div>

        </div>

        <div className="mt-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
          <h2 className="mb-6 text-3xl font-black text-yellow-400">
            ⚡ ترتيب السائقين الحقيقي
          </h2>

          {rankedDrivers.length === 0 ? (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center text-slate-400">
              لا يوجد سائقين متصلين حالياً
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rankedDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className={`rounded-3xl p-5 border ${
                    index === 0
                      ? "bg-yellow-400 text-black border-yellow-300"
                      : "bg-slate-950 text-white border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-black">
                      #{index + 1} {driver.name || driver.id}
                    </h3>

                    <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white">
                      متصل
                    </span>
                  </div>

                  <p className="mt-3">📞 {driver.phone || "لا يوجد رقم"}</p>
                  <p className="mt-2">
                    📍 المسافة: {driver.distance.toFixed(2)} كم
                  </p>
                  <p className="mt-2">⏱️ الوصول المتوقع: {driver.eta} دقيقة</p>
                  <p className="mt-2">⭐ AI Score: {driver.score}/100</p>
                  <p className="mt-2">🕒 {formatTime(driver.lastSeen)}</p>

                  <a
                    href={`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 block rounded-2xl py-3 text-center font-black ${
                      index === 0
                        ? "bg-black text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    فتح الخريطة
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <BrainNote title="🧠 Fuse AI" text="الأفضل توزيع الطلب على أقرب سائق بدقة GPS أقل من 50 متر." />
          <BrainNote title="⚠️ تنبيه" text="السائقين المتصلين بدون GPS لا يدخلون في الترشيح الذكي." />
          <BrainNote title="🚀 اقتراح" text="اربط زر التوزيع لاحقاً مع Firestore لتغيير حالة الطلب وتعيين driverId." />
        </div>

      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center shadow-xl">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-4 text-5xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function BrainNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
      <h3 className="text-2xl font-black text-purple-400">{title}</h3>
      <p className="mt-4 text-slate-300 leading-8">{text}</p>
    </div>
  );
}