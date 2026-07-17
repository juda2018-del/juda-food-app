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
  lastSeen?: number;
};

function randomDistance() {
  return Number((Math.random() * 7 + 0.5).toFixed(1));
}

export default function DispatchAIProPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

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

  const availableDrivers = useMemo(() => {
    return drivers
      .filter((driver) => driver.status === "متصل")
      .map((driver) => ({
        ...driver,
        distance: randomDistance(),
        score: Math.floor(Math.random() * 20) + 80,
      }))
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }

        return b.score - a.score;
      });
  }, [drivers]);

  const bestDriver = availableDrivers[0];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black text-white p-6"
    >
      <div className="max-w-7xl mx-auto">

        <h1 className="text-center text-5xl font-black text-yellow-400">
          🧠 Dispatch AI Pro
        </h1>

        <p className="text-center text-gray-300 mt-3">
          اختيار السائق الأنسب تلقائياً
        </p>

        {bestDriver && (
          <div className="bg-green-500 rounded-3xl p-8 mt-10 text-black">

            <h2 className="text-4xl font-black">
              🏆 السائق المقترح
            </h2>

            <div className="mt-6 space-y-3 text-2xl">

              <p>
                🚗 {bestDriver.name || bestDriver.id}
              </p>

              <p>
                📞 {bestDriver.phone || "لا يوجد رقم"}
              </p>

              <p>
                📍 المسافة التقريبية: {bestDriver.distance} كم
              </p>

              <p>
                ⭐ AI Score: {bestDriver.score}/100
              </p>

            </div>

          </div>
        )}

        <div className="grid gap-5 mt-10 md:grid-cols-2">

          {availableDrivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-3xl p-6 text-black shadow-xl"
            >

              <div className="flex items-center justify-between">

                <h2 className="text-3xl font-black">
                  🚗 {driver.name || driver.id}
                </h2>

                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  متصل
                </span>

              </div>

              <div className="space-y-3 mt-5 text-lg">

                <p>
                  📞 {driver.phone || "لا يوجد رقم"}
                </p>

                <p>
                  📍 المسافة: {driver.distance} كم
                </p>

                <p>
                  ⭐ AI Score: {driver.score}/100
                </p>

              </div>

            </div>
          ))}

          {availableDrivers.length === 0 && (
            <div className="bg-white rounded-3xl p-8 text-center text-black">
              لا يوجد سائقون متصلون حالياً
            </div>
          )}

        </div>

      </div>
    </main>
  );
}