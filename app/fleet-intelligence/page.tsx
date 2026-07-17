"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  rating?: number;
  totalOrders?: number;
  lastSeen?: number;
  latitude?: number;
  longitude?: number;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export default function FleetIntelligencePage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

  const onlineDrivers = drivers.filter(
    (driver) => driver.status === "متصل"
  );

  const offlineDrivers = drivers.filter(
    (driver) => driver.status !== "متصل"
  );

  const gpsDrivers = drivers.filter(
    (driver) =>
      typeof driver.latitude === "number" &&
      typeof driver.longitude === "number"
  );

  const averageRating = average(
    drivers
      .map((driver) => Number(driver.rating || 0))
      .filter((value) => value > 0)
  );

  const topDrivers = useMemo(() => {
    return [...drivers].sort(
      (a, b) =>
        Number(b.totalOrders || 0) - Number(a.totalOrders || 0)
    );
  }, [drivers]);

  const fleetHealth = useMemo(() => {
    if (onlineDrivers.length >= 10) {
      return {
        title: "ممتاز",
        color: "text-green-400",
      };
    }

    if (onlineDrivers.length >= 5) {
      return {
        title: "جيد",
        color: "text-yellow-400",
      };
    }

    return {
      title: "يحتاج متابعة",
      color: "text-red-400",
    };
  }, [onlineDrivers.length]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-center text-6xl font-black text-yellow-400">
          🚗 Fleet Intelligence
        </h1>

        <p className="text-center text-slate-400 mt-3">
          مركز إدارة وتحليل الأسطول
        </p>

        <div className="grid md:grid-cols-4 gap-6 mt-10">

          <Card title="كل السائقين" value={drivers.length} />

          <Card
            title="السائقون المتصلون"
            value={onlineDrivers.length}
            color="text-green-400"
          />

          <Card
            title="السائقون غير المتصلين"
            value={offlineDrivers.length}
            color="text-red-400"
          />

          <Card
            title="متوسط التقييم"
            value={averageRating.toFixed(1)}
            color="text-yellow-400"
          />

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-black text-yellow-400 mb-6">
              🏆 أفضل السائقين
            </h2>

            <div className="space-y-4">

              {topDrivers.slice(0, 7).map((driver, index) => (
                <div
                  key={driver.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between"
                >
                  <div>
                    <p className="font-black text-xl">
                      #{index + 1} {driver.name || driver.id}
                    </p>

                    <p className="text-slate-400 mt-2">
                      ⭐ {driver.rating || 0}
                    </p>
                  </div>

                  <div className="text-yellow-400 font-black">
                    {driver.totalOrders || 0} طلب
                  </div>
                </div>
              ))}

            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-black text-purple-400 mb-6">
              🤖 Fleet AI
            </h2>

            <div className="space-y-4">

              <Alert text="🚨 يفضّل زيادة عدد السائقين وقت الذروة." />

              <Alert text="📍 زيونة تحتاج تغطية أكبر." />

              <Alert text="⚡ يوجد ضغط مرتفع مساءً." />

              <Alert text="🛵 فعّل 3 سائقين إضافيين بين 7 و10 مساءً." />

            </div>

          </div>

        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-3xl font-black text-green-400">
            🟢 Fleet Health
          </h2>

          <p className={`text-5xl font-black mt-5 ${fleetHealth.color}`}>
            {fleetHealth.title}
          </p>

        </div>

      </div>
    </main>
  );
}

function Card({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
      <p className="text-slate-400">{title}</p>

      <p className={`text-4xl font-black mt-4 ${color}`}>
        {value}
      </p>
    </div>
  );
}

function Alert({
  text,
}: {
  text: string;
}) {
  return (
    <div className="bg-purple-500/20 rounded-2xl p-5">
      {text}
    </div>
  );
}