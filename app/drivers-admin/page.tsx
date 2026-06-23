"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type DriverStatus = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  lastSeen?: number;
};

type Order = {
  id: string;
  driverName?: string;
  status?: string;
  total?: number;
};

function formatDate(value?: number) {
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

function isOnline(driver: DriverStatus) {
  if (driver.status !== "متصل") return false;

  if (!driver.lastSeen) return true;

  const diff = Date.now() - driver.lastSeen;

  return diff < 1000 * 60 * 3;
}

function hasLocation(driver: DriverStatus) {
  return (
    typeof driver.latitude === "number" &&
    typeof driver.longitude === "number"
  );
}

export default function DriversAdminPage() {
  const [drivers, setDrivers] = useState<DriverStatus[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as DriverStatus[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, []);

  const onlineCount = drivers.filter((driver) => isOnline(driver)).length;
  const offlineCount = drivers.length - onlineCount;

  const deliveredOrders = useMemo(() => {
    return orders.filter((order) => order.status === "تم التسليم");
  }, [orders]);

  function driverDeliveredCount(driverName?: string) {
    if (!driverName) return 0;

    return deliveredOrders.filter(
      (order) => (order.driverName || "").trim() === driverName.trim()
    ).length;
  }

  function driverDeliveredTotal(driverName?: string) {
    if (!driverName) return 0;

    return deliveredOrders
      .filter((order) => (order.driverName || "").trim() === driverName.trim())
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          لوحة إدارة السائقين
        </h1>

        <p className="mt-2 text-center text-gray-300">
          متابعة السائقين المتصلين ومواقعهم مباشرة
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="كل السائقين" value={drivers.length} />
          <StatCard title="متصلين" value={onlineCount} green />
          <StatCard title="غير متصلين" value={offlineCount} red />
          <StatCard title="طلبات مسلّمة" value={deliveredOrders.length} />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {drivers.length === 0 ? (
            <div className="rounded-3xl bg-white/10 p-8 text-center text-gray-300">
              لا يوجد سائقين حالياً. افتح تطبيق السائق وسجل دخول حتى يظهر هنا.
            </div>
          ) : (
            drivers.map((driver) => {
              const online = isOnline(driver);
              const mapUrl = hasLocation(driver)
                ? `https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`
                : "";
              const embedUrl = hasLocation(driver)
                ? `https://maps.google.com/maps?q=${driver.latitude},${driver.longitude}&z=16&output=embed`
                : "";

              return (
                <div
                  key={driver.id}
                  className="rounded-3xl bg-white p-5 text-black shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black">
                        {driver.name || driver.id}
                      </h2>

                      <p className="mt-2 text-gray-700">
                        📞 {driver.phone || "لا يوجد رقم"}
                      </p>

                      <p className="mt-1 text-gray-700">
                        🕒 آخر تحديث: {formatDate(driver.lastSeen)}
                      </p>

                      {driver.accuracy && (
                        <p className="mt-1 text-gray-700">
                          🎯 دقة الموقع: {Math.round(driver.accuracy)} متر
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-black ${
                        online
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {online ? "متصل" : "غير متصل"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MiniCard
                      title="طلبات مسلّمة"
                      value={driverDeliveredCount(driver.name)}
                    />

                    <MiniCard
                      title="قيمة المسلّمة"
                      value={`${driverDeliveredTotal(
                        driver.name
                      ).toLocaleString()} د.ع`}
                    />
                  </div>

                  {hasLocation(driver) ? (
                    <div className="mt-5">
                      <div className="overflow-hidden rounded-2xl border border-gray-200">
                        <iframe
                          title={`موقع ${driver.name || driver.id}`}
                          src={embedUrl}
                          className="h-64 w-full border-0"
                          loading="lazy"
                        />
                      </div>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 block rounded-2xl bg-blue-600 py-3 text-center font-black text-white"
                      >
                        فتح موقع السائق على Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-gray-100 p-4 text-center font-bold text-gray-600">
                      موقع السائق غير متوفر حالياً
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: string | number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p
        className={`mt-2 text-3xl font-black ${
          green ? "text-green-400" : red ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-black">{value}</p>
    </div>
  );
}