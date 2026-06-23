"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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

function hasLocation(driver?: Driver | null) {
  return (
    typeof driver?.latitude === "number" &&
    typeof driver?.longitude === "number"
  );
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
    year: "numeric",
  });
}

export default function LiveMapTrackingPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Driver[];

      setDrivers(data);

      if (!selectedDriverId && data.length > 0) {
        setSelectedDriverId(data[0].id);
      }
    });

    return () => unsub();
  }, [selectedDriverId]);

  const selectedDriver = useMemo(() => {
    return drivers.find((driver) => driver.id === selectedDriverId) || null;
  }, [drivers, selectedDriverId]);

  const mapUrl = hasLocation(selectedDriver)
    ? `https://maps.google.com/maps?q=${selectedDriver?.latitude},${selectedDriver?.longitude}&z=16&output=embed`
    : "https://maps.google.com/maps?q=Baghdad,Iraq&z=11&output=embed";

  const openMapUrl = hasLocation(selectedDriver)
    ? `https://www.google.com/maps?q=${selectedDriver?.latitude},${selectedDriver?.longitude}`
    : "https://www.google.com/maps?q=Baghdad,Iraq";

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-5xl font-black text-yellow-400">
          🗺️ تتبع السائق بالخريطة
        </h1>

        <p className="mt-2 text-center text-gray-300">
          موقع السائق مباشر من Firebase driversStatus
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[340px_1fr]">
          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-2xl font-black">السائقين</h2>

            {drivers.length === 0 ? (
              <div className="rounded-2xl bg-gray-100 p-5 text-center text-gray-500">
                لا يوجد سائقين حالياً
              </div>
            ) : (
              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
                {drivers.map((driver) => {
                  const active = selectedDriverId === driver.id;

                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`rounded-2xl p-4 text-right ${
                        active ? "bg-yellow-400" : "bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-black">
                          {driver.name || driver.id}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            driver.status === "متصل"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {driver.status || "غير معروف"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm">
                        📞 {driver.phone || "لا يوجد رقم"}
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        🕒 {formatTime(driver.lastSeen)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 text-black">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">
                  {selectedDriver?.name || "اختر سائق"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  آخر تحديث: {formatTime(selectedDriver?.lastSeen)}
                </p>
              </div>

              <a
                href={openMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
              >
                فتح Google Maps
              </a>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200">
              <iframe
                title="Live Driver Map"
                src={mapUrl}
                className="h-[560px] w-full border-0"
                loading="lazy"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <InfoCard
                title="Latitude"
                value={
                  hasLocation(selectedDriver)
                    ? String(selectedDriver?.latitude)
                    : "غير متوفر"
                }
              />

              <InfoCard
                title="Longitude"
                value={
                  hasLocation(selectedDriver)
                    ? String(selectedDriver?.longitude)
                    : "غير متوفر"
                }
              />

              <InfoCard
                title="GPS"
                value={
                  selectedDriver?.accuracy
                    ? `${Math.round(selectedDriver.accuracy)} م`
                    : "غير محدد"
                }
              />

              <InfoCard
                title="الحالة"
                value={selectedDriver?.status || "غير معروف"}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 text-center">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}