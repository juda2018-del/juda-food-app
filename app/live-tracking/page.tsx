"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  accuracy?: number;
  lastSeen?: number;
};

function formatTime(lastSeen?: number) {
  if (!lastSeen) return "غير معروف";

  return new Date(lastSeen).toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveTrackingPage() {
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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black text-white p-6"
    >
      <div className="max-w-6xl mx-auto">

        <h1 className="text-center text-5xl font-black text-yellow-400">
          📍 التتبع المباشر
        </h1>

        <p className="text-center text-gray-300 mt-3">
          حالة السائقين والمواقع الحية
        </p>

        <div className="grid gap-5 mt-10 md:grid-cols-2">

          {drivers.length === 0 && (
            <div className="bg-white rounded-3xl p-8 text-center text-black">
              لا يوجد سائقون متصلون حالياً
            </div>
          )}

          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-3xl p-6 text-black shadow-xl"
            >

              <div className="flex items-center justify-between">

                <h2 className="text-3xl font-black">
                  🚗 {driver.name || driver.id}
                </h2>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    driver.status === "متصل"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {driver.status || "غير معروف"}
                </span>

              </div>

              <div className="mt-5 space-y-3 text-lg">

                <p>
                  📞 {driver.phone || "لا يوجد رقم"}
                </p>

                <p>
                  🌍 Latitude:{" "}
                  {driver.latitude ?? "غير متوفر"}
                </p>

                <p>
                  🌍 Longitude:{" "}
                  {driver.longitude ?? "غير متوفر"}
                </p>

                <p>
                  🎯 Accuracy:{" "}
                  {driver.accuracy ?? "-"}
                </p>

                <p>
                  🕒 آخر ظهور:{" "}
                  {formatTime(driver.lastSeen)}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}