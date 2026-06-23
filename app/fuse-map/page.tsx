 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  status?: string;
  driverName?: string;
  total?: number;
  createdAt?: any;
};

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function hasLocation(driver?: Driver) {
  return (
    typeof driver?.latitude === "number" &&
    typeof driver?.longitude === "number"
  );
}

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

function driverState(driver: Driver, busyDriverNames: string[]) {
  if (!isOnline(driver)) return "offline";
  if (busyDriverNames.includes(String(driver.name || "").trim())) return "busy";
  return "available";
}

function stateText(state: string) {
  if (state === "available") return "متاح";
  if (state === "busy") return "مشغول";
  return "غير متصل";
}

function stateColor(state: string) {
  if (state === "available") return "bg-green-500";
  if (state === "busy") return "bg-yellow-400";
  return "bg-red-500";
}

function stateBox(state: string) {
  if (state === "available") return "border-green-400 bg-green-50";
  if (state === "busy") return "border-yellow-400 bg-yellow-50";
  return "border-red-400 bg-red-50";
}

export default function FuseMapPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const busyDriverNames = activeOrders
    .filter((order) => order.status === "قيد التوصيل" && order.driverName)
    .map((order) => String(order.driverName).trim());

  const onlineDrivers = drivers.filter((driver) => isOnline(driver));
  const offlineDrivers = drivers.filter((driver) => !isOnline(driver));

  const availableDrivers = onlineDrivers.filter(
    (driver) => !busyDriverNames.includes(String(driver.name || "").trim())
  );

  const busyDrivers = onlineDrivers.filter((driver) =>
    busyDriverNames.includes(String(driver.name || "").trim())
  );

  const selectedDriver =
    drivers.find((driver) => driver.id === selectedDriverId) || drivers[0];

  const aiBestDriver = useMemo(() => {
    if (availableDrivers.length > 0) {
      return [...availableDrivers].sort(
        (a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)
      )[0];
    }

    return onlineDrivers[0];
  }, [availableDrivers, onlineDrivers]);

  const mapUrl = hasLocation(selectedDriver)
    ? `https://maps.google.com/maps?q=${selectedDriver?.latitude},${selectedDriver?.longitude}&z=15&output=embed`
    : "https://maps.google.com/maps?q=Baghdad,Iraq&z=11&output=embed";

  const googleOpenUrl = hasLocation(selectedDriver)
    ? `https://www.google.com/maps?q=${selectedDriver?.latitude},${selectedDriver?.longitude}`
    : "https://www.google.com/maps?q=Baghdad,Iraq";

  const aiAlerts = [
    activeOrders.length > onlineDrivers.length && activeOrders.length > 0
      ? "⚠️ الطلبات الحالية أكثر من عدد السائقين المتصلين"
      : "✅ عدد السائقين مناسب حالياً",
    availableDrivers.length === 0
      ? "🚨 لا يوجد سائق متاح حالياً"
      : `🟢 يوجد ${availableDrivers.length} سائق متاح`,
    busyDrivers.length > 0
      ? `🟡 يوجد ${busyDrivers.length} سائق مشغول بالتوصيل`
      : "✅ لا يوجد ضغط على السائقين",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <h1 className="text-center text-5xl font-black text-yellow-400">
          Fuse Live Map 🗺️
        </h1>

        <p className="mt-2 text-center text-gray-300">
          غرفة عمليات مباشرة للسائقين والطلبات
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard title="كل السائقين" value={drivers.length} />
          <StatCard title="متصلين" value={onlineDrivers.length} green />
          <StatCard title="متاحين" value={availableDrivers.length} green />
          <StatCard title="مشغولين" value={busyDrivers.length} orange />
          <StatCard title="غير متصلين" value={offlineDrivers.length} red />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl bg-white p-5 text-black">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Driver Radar AI</h2>

              <a
                href={googleOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white"
              >
                Google Maps
              </a>
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-3xl bg-gray-100 p-5">
              <iframe
                title="Fuse Live Map"
                src={mapUrl}
                className="absolute inset-0 h-full w-full border-0 opacity-40"
                loading="lazy"
              />

              <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {drivers.map((driver, index) => {
                  const state = driverState(driver, busyDriverNames);
                  const isBest = aiBestDriver?.id === driver.id;
                  const isSelected = selectedDriver?.id === driver.id;

                  return (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`rounded-3xl border-4 p-4 text-right shadow-xl transition ${
                        isBest
                          ? "border-yellow-400 bg-yellow-100"
                          : isSelected
                          ? "border-blue-500 bg-blue-50"
                          : stateBox(state)
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`h-5 w-5 rounded-full ${stateColor(state)}`}
                        />
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                          {isBest ? "AI Pick" : stateText(state)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black">
                        {driver.name || driver.id}
                      </h3>

                      <p className="mt-1 text-sm">📞 {driver.phone || "لا يوجد"}</p>
                      <p className="mt-1 text-sm">
                        🎯{" "}
                        {driver.accuracy
                          ? `${Math.round(driver.accuracy)} متر`
                          : "دقة غير محددة"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(driver.lastSeen)}
                      </p>

                      <div className="mt-3 rounded-2xl bg-white/80 p-2 text-center text-sm font-bold">
                        ETA تقريبي: {state === "busy" ? "12 د" : "8 د"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {drivers.length === 0 && (
                <div className="relative z-10 rounded-3xl bg-white p-8 text-center text-gray-500">
                  لا يوجد سائقين حالياً
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl bg-white p-5 text-black">
              <h2 className="mb-3 text-2xl font-black">🧠 اقتراح Fuse AI</h2>

              {aiBestDriver ? (
                <div className="rounded-2xl bg-yellow-400 p-4 text-center">
                  <p className="text-sm font-bold">السائق المقترح</p>
                  <h3 className="mt-2 text-3xl font-black">
                    {aiBestDriver.name || aiBestDriver.id}
                  </h3>
                  <p className="mt-2 font-bold">الثقة: 94%</p>
                  <p className="mt-1 text-sm">
                    السبب: متصل + متاح + آخر تحديث قريب
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-red-100 p-4 text-center font-bold text-red-700">
                  لا يوجد سائق مناسب حالياً
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 text-black">
              <h2 className="mb-3 text-2xl font-black">🚨 تنبيهات مباشرة</h2>

              <div className="flex flex-col gap-2">
                {aiAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-gray-100 p-3 font-bold"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 text-black">
              <h2 className="mb-3 text-2xl font-black">👤 السائق المحدد</h2>

              {selectedDriver ? (
                <div className="rounded-2xl bg-gray-100 p-4">
                  <h3 className="text-2xl font-black">
                    {selectedDriver.name || selectedDriver.id}
                  </h3>
                  <p className="mt-2">📞 {selectedDriver.phone || "لا يوجد"}</p>
                  <p className="mt-1">
                    الحالة:{" "}
                    {stateText(driverState(selectedDriver, busyDriverNames))}
                  </p>
                  <p className="mt-1">
                    آخر تحديث: {formatDate(selectedDriver.lastSeen)}
                  </p>

                  {hasLocation(selectedDriver) && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedDriver.latitude},${selectedDriver.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 block rounded-2xl bg-blue-600 py-3 text-center font-black text-white"
                    >
                      فتح موقع السائق
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-100 p-4 text-center text-gray-500">
                  اختر سائق من الرادار
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <DriversColumn
            title="🟢 متاحين"
            drivers={availableDrivers}
            selectedDriverId={selectedDriverId}
            onSelect={setSelectedDriverId}
            empty="لا يوجد سائقين متاحين"
          />

          <DriversColumn
            title="🟡 مشغولين"
            drivers={busyDrivers}
            selectedDriverId={selectedDriverId}
            onSelect={setSelectedDriverId}
            empty="لا يوجد سائقين مشغولين"
          />

          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-2xl font-black">📦 الطلبات الحالية</h2>

            {activeOrders.length === 0 ? (
              <div className="rounded-2xl bg-gray-100 p-5 text-center text-gray-500">
                لا توجد طلبات حالياً
              </div>
            ) : (
              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
                {activeOrders.slice(0, 20).map((order) => (
                  <div key={order.id} className="rounded-2xl bg-gray-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black">
                          {order.customerName || "زبون"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {order.restaurant || "مطعم غير محدد"}
                        </p>
                      </div>

                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold">
                        {order.status || "جديد"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">
                      🚗 {order.driverName || "لم يحدد سائق"}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      📍 {order.address || "لا يوجد عنوان"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  orange,
}: {
  title: string;
  value: string | number;
  green?: boolean;
  red?: boolean;
  orange?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p
        className={`mt-2 text-3xl font-black ${
          green
            ? "text-green-400"
            : red
            ? "text-red-400"
            : orange
            ? "text-orange-400"
            : "text-yellow-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DriversColumn({
  title,
  drivers,
  selectedDriverId,
  onSelect,
  empty,
}: {
  title: string;
  drivers: Driver[];
  selectedDriverId: string;
  onSelect: (id: string) => void;
  empty: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 text-black">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>

      {drivers.length === 0 ? (
        <div className="rounded-2xl bg-gray-100 p-5 text-center text-gray-500">
          {empty}
        </div>
      ) : (
        <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
          {drivers.map((driver) => {
            const active = selectedDriverId === driver.id;

            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => onSelect(driver.id)}
                className={`rounded-2xl p-4 text-right ${
                  active ? "bg-yellow-400" : "bg-gray-100"
                }`}
              >
                <h3 className="text-xl font-black">
                  {driver.name || driver.id}
                </h3>
                <p className="mt-1 text-sm">📞 {driver.phone || "لا يوجد رقم"}</p>
                <p className="mt-1 text-xs text-gray-600">
                  آخر تحديث: {formatDate(driver.lastSeen)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}