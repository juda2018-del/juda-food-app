"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: any;
};

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

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;

  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function hasLocation(driver: Driver) {
  return (
    typeof driver.latitude === "number" &&
    typeof driver.longitude === "number"
  );
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDate(value: any) {
  if (!value) return "لا يوجد وقت";

  try {
    let date: Date;

    if (typeof value?.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "number") {
      date = new Date(value);
    } else if (typeof value === "string") {
      date = new Date(value);
    } else {
      return "لا يوجد وقت";
    }

    if (isNaN(date.getTime())) return "لا يوجد وقت";

    return date.toLocaleString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "لا يوجد وقت";
  }
}

export default function SmartDispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [autoDispatch, setAutoDispatch] = useState(false);

  const processingOrders = useRef<string[]>([]);

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

  const readyOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.status === "جاهز للتوصيل" &&
        !order.driverName &&
        !order.driverPhone
    );
  }, [orders]);

  const onlineDrivers = useMemo(() => {
    return drivers.filter((driver) => isOnline(driver) && hasLocation(driver));
  }, [drivers]);

  const busyDriverNames = useMemo(() => {
    return orders
      .filter((order) => order.status === "قيد التوصيل" && order.driverName)
      .map((order) => String(order.driverName).trim());
  }, [orders]);

  const availableDrivers = useMemo(() => {
    return onlineDrivers.filter(
      (driver) => !busyDriverNames.includes(String(driver.name || "").trim())
    );
  }, [onlineDrivers, busyDriverNames]);

  function addLog(message: string) {
    const time = new Date().toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setDispatchLog((old) => [`${time} - ${message}`, ...old].slice(0, 20));
  }

  function chooseBestDriver() {
    if (availableDrivers.length === 0) return null;

    const sorted = [...availableDrivers].sort((a, b) => {
      const aSeen = a.lastSeen || 0;
      const bSeen = b.lastSeen || 0;

      return bSeen - aSeen;
    });

    return sorted[0];
  }

  async function assignOrder(order: Order) {
    if (processingOrders.current.includes(order.id)) return;

    const driver = chooseBestDriver();

    if (!driver) {
      addLog(`لا يوجد سائق متاح للطلب ${order.id.slice(0, 6)}`);
      return;
    }

    try {
      processingOrders.current.push(order.id);

      await updateDoc(doc(db, "orders", order.id), {
        status: "قيد التوصيل",
        driverName: driver.name || driver.id,
        driverPhone: driver.phone || "",
        dispatchType: "تلقائي",
        dispatchAt: Date.now(),
        dispatchNote: "تم اختيار السائق تلقائياً من لوحة التوزيع الذكي",
      });

      addLog(
        `تم إسناد الطلب ${order.id.slice(0, 6)} إلى ${
          driver.name || driver.id
        }`
      );
    } catch (error) {
      console.error(error);
      addLog(`صار خطأ بإسناد الطلب ${order.id.slice(0, 6)}`);
    } finally {
      setTimeout(() => {
        processingOrders.current = processingOrders.current.filter(
          (id) => id !== order.id
        );
      }, 3000);
    }
  }

  async function assignAllReadyOrders() {
    if (readyOrders.length === 0) {
      addLog("لا توجد طلبات جاهزة للتوزيع");
      return;
    }

    if (availableDrivers.length === 0) {
      addLog("لا يوجد سائقين متاحين حالياً");
      return;
    }

    for (const order of readyOrders) {
      await assignOrder(order);
    }
  }

  useEffect(() => {
    if (!autoDispatch) return;
    if (readyOrders.length === 0) return;
    if (availableDrivers.length === 0) return;

    readyOrders.forEach((order) => {
      assignOrder(order);
    });
  }, [autoDispatch, readyOrders, availableDrivers]);

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          التوزيع الذكي للطلبات
        </h1>

        <p className="mt-2 text-center text-gray-300">
          إسناد الطلبات الجاهزة تلقائياً للسائقين المتاحين
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard title="جاهزة للتوزيع" value={readyOrders.length} />
          <StatCard title="سائقين متصلين" value={onlineDrivers.length} green />
          <StatCard title="سائقين متاحين" value={availableDrivers.length} green />
          <StatCard title="سائقين مشغولين" value={busyDriverNames.length} red />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button
            onClick={assignAllReadyOrders}
            className="rounded-3xl bg-yellow-400 py-4 text-xl font-black text-black"
          >
            وزّع كل الطلبات الجاهزة الآن
          </button>

          <button
            onClick={() => setAutoDispatch((old) => !old)}
            className={`rounded-3xl py-4 text-xl font-black ${
              autoDispatch
                ? "bg-green-600 text-white"
                : "bg-white/10 text-white"
            }`}
          >
            {autoDispatch ? "التوزيع التلقائي شغّال" : "تشغيل التوزيع التلقائي"}
          </button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/10 p-4">
            <h2 className="mb-4 text-2xl font-black text-yellow-400">
              الطلبات الجاهزة للتوصيل
            </h2>

            {readyOrders.length === 0 ? (
              <div className="rounded-2xl bg-black/40 p-6 text-center text-gray-300">
                لا توجد طلبات جاهزة حالياً
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-4 text-black"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          {order.customerName || "زبون"}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          #{String(order.id).slice(0, 6)}
                        </p>
                      </div>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">
                        جاهز للتوصيل
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>🍽️ {order.restaurant || "مطعم غير محدد"}</p>
                      <p>📞 {order.phone || "لا يوجد رقم"}</p>
                      <p>📍 {order.address || "لا يوجد عنوان"}</p>
                      <p>🕒 {formatDate(order.createdAt)}</p>
                      <p className="font-black">
                        {(order.total || 0).toLocaleString()} د.ع
                      </p>
                    </div>

                    <button
                      onClick={() => assignOrder(order)}
                      className="mt-4 w-full rounded-2xl bg-black py-3 font-black text-white"
                    >
                      إسناد ذكي لهذا الطلب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white/10 p-4">
            <h2 className="mb-4 text-2xl font-black text-yellow-400">
              السائقين المتاحين
            </h2>

            {availableDrivers.length === 0 ? (
              <div className="rounded-2xl bg-black/40 p-6 text-center text-gray-300">
                لا يوجد سائقين متاحين حالياً
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="rounded-2xl bg-white p-4 text-black"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">
                          {driver.name || driver.id}
                        </h3>

                        <p className="mt-1 text-sm text-gray-700">
                          📞 {driver.phone || "لا يوجد رقم"}
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          🎯 الدقة:{" "}
                          {driver.accuracy
                            ? `${Math.round(driver.accuracy)} متر`
                            : "غير محددة"}
                        </p>

                        <p className="mt-1 text-sm text-gray-700">
                          🕒 آخر تحديث: {formatDate(driver.lastSeen)}
                        </p>
                      </div>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                        متاح
                      </span>
                    </div>

                    {hasLocation(driver) && (
                      <a
                        href={`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block rounded-2xl bg-blue-600 py-3 text-center font-black text-white"
                      >
                        فتح موقع السائق
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white/10 p-4">
          <h2 className="mb-4 text-2xl font-black text-yellow-400">
            سجل التوزيع
          </h2>

          {dispatchLog.length === 0 ? (
            <div className="rounded-2xl bg-black/40 p-5 text-center text-gray-400">
              لا توجد عمليات توزيع بعد
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dispatchLog.map((log, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-black/40 p-3 text-sm text-gray-200"
                >
                  {log}
                </div>
              ))}
            </div>
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