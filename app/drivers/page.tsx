 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import NotificationPermission from "../components/NotificationPermission";

type Order = {
  id: string;
  driverName?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

type DriverStatus = {
  id: string;
  name?: string;
  phone?: string;
  status?: "متصل" | "غير متصل";
  lastSeen?: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

type Driver = {
  name: string;
  phone: string;
  password: string;
};

const drivers: Driver[] = [
  { name: "محمد علي", phone: "07701234567", password: "1234" },
  { name: "حيدر كريم", phone: "07709876543", password: "1234" },
];

export default function DriversPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<DriverStatus[]>([]);

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
    const q = query(collection(db, "driversStatus"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as DriverStatus[];

      setStatuses(data);
    });

    return () => unsub();
  }, []);

  const driverStats = useMemo(() => {
    return drivers.map((driver) => {
      const statusInfo = statuses.find(
        (s) => (s.name || "").trim() === driver.name.trim()
      );

      const realStatus =
        statusInfo?.status === "متصل" ? "متصل" : "غير متصل";

      const driverOrders = orders.filter(
        (order) => (order.driverName || "").trim() === driver.name.trim()
      );

      const deliveredOrders = driverOrders.filter(
        (order) => order.status === "تم التسليم"
      );

      const activeOrders = driverOrders.filter(
        (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
      );

      const earnings = deliveredOrders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );

      return {
        ...driver,
        status: realStatus,
        totalOrders: driverOrders.length,
        deliveredOrders: deliveredOrders.length,
        activeOrders: activeOrders.length,
        earnings,
        lastSeen: statusInfo?.lastSeen || null,
        latitude: statusInfo?.latitude || null,
        longitude: statusInfo?.longitude || null,
        accuracy: statusInfo?.accuracy || null,
      };
    });
  }, [orders, statuses]);

  const onlineDrivers = driverStats.filter(
    (driver) => driver.status === "متصل"
  ).length;

  const offlineDrivers = driverStats.filter(
    (driver) => driver.status === "غير متصل"
  ).length;

  const totalDelivered = driverStats.reduce(
    (sum, driver) => sum + driver.deliveredOrders,
    0
  );

  const totalEarnings = driverStats.reduce(
    (sum, driver) => sum + driver.earnings,
    0
  );

  const driversWithLocation = driverStats.filter(
    (driver) => driver.latitude && driver.longitude
  );

  const firstDriverLocation = driversWithLocation[0];

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          لوحة السائقين
        </h1>

        <p className="mt-2 text-center text-gray-300">
          متابعة السائقين وطلباتهم في FUSE
        </p>

        <div className="mx-auto mt-4 max-w-md">
          <NotificationPermission userType="admin" userId="fuse-admin" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card title="عدد السائقين" value={drivers.length} />
          <Card title="المتصلين" value={onlineDrivers} green />
          <Card title="غير المتصلين" value={offlineDrivers} red />
          <Card title="طلبات مسلمة" value={totalDelivered} />
        </div>

        <div className="mt-4 rounded-3xl bg-white/10 p-4 text-center">
          <p className="text-sm text-gray-300">إجمالي أرباح السائقين</p>
          <p className="mt-2 text-4xl font-black text-yellow-400">
            {totalEarnings.toLocaleString()} د.ع
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 text-black shadow-xl">
          <h2 className="mb-3 text-2xl font-black">خريطة السائقين المباشرة</h2>

          {firstDriverLocation ? (
            <>
              <div className="overflow-hidden rounded-3xl border border-gray-200">
                <iframe
                  title="خريطة السائقين"
                  className="h-[360px] w-full"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${firstDriverLocation.latitude},${firstDriverLocation.longitude}&z=16&output=embed`}
                />
              </div>

              <p className="mt-3 text-center text-sm text-gray-600">
                المعروض حالياً:{" "}
                <span className="font-black">{firstDriverLocation.name}</span>
              </p>
            </>
          ) : (
            <div className="rounded-3xl bg-gray-100 p-8 text-center">
              <p className="text-xl font-black">لا يوجد موقع سائق حالياً</p>
              <p className="mt-2 text-gray-600">
                افتح تطبيق السائق واسمح للموقع GPS حتى يظهر هنا
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {driverStats.map((driver) => (
            <div
              key={driver.phone}
              className="rounded-3xl bg-white p-5 text-black shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{driver.name}</h2>
                  <p className="mt-2 text-gray-700">📞 {driver.phone}</p>

                  <p className="mt-1 text-xs text-gray-500">
                    آخر تحديث:{" "}
                    {driver.lastSeen
                      ? new Date(driver.lastSeen).toLocaleString("ar-IQ")
                      : "لا يوجد"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    الموقع:{" "}
                    {driver.latitude && driver.longitude
                      ? `${driver.latitude}, ${driver.longitude}`
                      : "لا يوجد"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 font-bold text-white ${
                    driver.status === "متصل" ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {driver.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniCard title="كل الطلبات" value={driver.totalOrders} />
                <MiniCard title="طلبات نشطة" value={driver.activeOrders} />
                <MiniCard title="تم التسليم" value={driver.deliveredOrders} />
                <MiniCard
                  title="الأرباح"
                  value={`${driver.earnings.toLocaleString()} د.ع`}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                <a
                  href={`tel:${driver.phone}`}
                  className="rounded-2xl bg-black py-3 text-center font-bold text-white"
                >
                  اتصال
                </a>

                <a
                  href={`https://wa.me/964${driver.phone.slice(1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-green-600 py-3 text-center font-bold text-white"
                >
                  واتساب
                </a>

                {driver.latitude && driver.longitude ? (
                  <a
                    href={`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 rounded-2xl bg-purple-600 py-3 text-center font-bold text-white md:col-span-1"
                  >
                    فتح موقع السائق
                  </a>
                ) : (
                  <button
                    disabled
                    className="col-span-2 rounded-2xl bg-gray-400 py-3 text-center font-bold text-white md:col-span-1"
                  >
                    لا يوجد موقع
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({
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

function MiniCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}