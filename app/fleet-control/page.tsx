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
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
};

type Rating = {
  id: string;
  restaurant?: string;
  driverName?: string;
  driverRating?: number;
  restaurantRating?: number;
  createdAt?: number;
};

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function topList(items: { name: string; value: number }[]) {
  const map: Record<string, number> = {};

  items.forEach((item) => {
    const name = item.name || "غير محدد";
    map[name] = (map[name] || 0) + item.value;
  });

  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function money(value: number) {
  return value.toLocaleString();
}

export default function FleetControlPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

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
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Rating[];

      setRatings(data);
    });

    return () => unsub();
  }, []);

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const busyDriverNames = activeOrders
    .filter((order) => order.status === "قيد التوصيل" && order.driverName)
    .map((order) => String(order.driverName).trim());

  const onlineDrivers = drivers.filter((driver) => isOnline(driver));
  const availableDrivers = onlineDrivers.filter(
    (driver) => !busyDriverNames.includes(String(driver.name || "").trim())
  );
  const busyDrivers = onlineDrivers.filter((driver) =>
    busyDriverNames.includes(String(driver.name || "").trim())
  );
  const offlineDrivers = drivers.filter((driver) => !isOnline(driver));

  const newOrders = orders.filter((order) => (order.status || "جديد") === "جديد");
  const preparingOrders = orders.filter((order) => order.status === "قيد التحضير");
  const readyOrders = orders.filter((order) => order.status === "جاهز للتوصيل");
  const onDeliveryOrders = orders.filter((order) => order.status === "قيد التوصيل");

  const totalSales = deliveredOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  const expectedTomorrow = Math.round(totalSales * 1.12);
  const expectedWeek = Math.round(totalSales * 7.4);

  const driverRatings = ratings
    .map((rating) => Number(rating.driverRating || 0))
    .filter((value) => value > 0);

  const avgDriverRating = average(driverRatings);

  const topDrivers = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.driverName || "غير محدد",
        value: 1,
      }))
    );
  }, [deliveredOrders]);

  const topRestaurants = useMemo(() => {
    return topList(
      deliveredOrders.map((order) => ({
        name: order.restaurant || "غير محدد",
        value: order.total || 0,
      }))
    );
  }, [deliveredOrders]);

  const areas = useMemo(() => {
    return topList(
      activeOrders.map((order) => ({
        name: guessArea(order.address || ""),
        value: 1,
      }))
    );
  }, [activeOrders]);

  const aiDecisions = [
    activeOrders.length > onlineDrivers.length && activeOrders.length > 0
      ? "⚠️ الطلبات أكثر من السائقين المتصلين، شغّل سائقين إضافيين فوراً."
      : "✅ عدد السائقين مناسب لحجم الطلبات الحالي.",
    readyOrders.length > 0 && availableDrivers.length === 0
      ? "🚨 توجد طلبات جاهزة للتوصيل ولا يوجد سائق متاح."
      : "🚗 التوزيع الحالي مستقر.",
    topRestaurants[0]
      ? `🍽️ ${topRestaurants[0].name} هو أعلى مطعم نشاطاً حالياً.`
      : "🍽️ لا توجد بيانات كافية للمطاعم.",
    areas[0]
      ? `🔥 أكثر منطقة ضغط حالياً: ${areas[0].name}.`
      : "🔥 لا توجد بيانات كافية للمناطق.",
    avgDriverRating > 0 && avgDriverRating < 3
      ? "⭐ متوسط تقييم السائقين منخفض، راجع أداء الأسطول."
      : "⭐ تقييم السائقين ضمن الوضع المقبول.",
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        <h1 className="text-center text-5xl font-black text-yellow-400">
          Fleet Control AI 🚗
        </h1>

        <p className="mt-2 text-center text-gray-300">
          مركز قيادة الأسطول والطلبات والقرارات الذكية
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
          <StatCard title="كل السائقين" value={drivers.length} />
          <StatCard title="متصلين" value={onlineDrivers.length} green />
          <StatCard title="متاحين" value={availableDrivers.length} green />
          <StatCard title="مشغولين" value={busyDrivers.length} orange />
          <StatCard title="غير متصلين" value={offlineDrivers.length} red />
          <StatCard
            title="تقييم السائقين"
            value={`⭐ ${avgDriverRating.toFixed(1)}`}
            green
          />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard title="جديد" value={newOrders.length} />
          <StatCard title="قيد التحضير" value={preparingOrders.length} />
          <StatCard title="جاهزة" value={readyOrders.length} orange />
          <StatCard title="قيد التوصيل" value={onDeliveryOrders.length} orange />
          <StatCard title="نشطة" value={activeOrders.length} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-3xl font-black">
              🧠 قرارات Fuse AI
            </h2>

            <div className="flex flex-col gap-3">
              {aiDecisions.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-yellow-100 p-4 text-lg font-bold"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-3xl font-black">
              💰 توقع المبيعات
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ForecastCard title="اليوم" value={`${money(totalSales)} د.ع`} />
              <ForecastCard title="غداً" value={`${money(expectedTomorrow)} د.ع`} />
              <ForecastCard title="الأسبوع" value={`${money(expectedWeek)} د.ع`} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <ListCard
            title="🏆 أفضل السائقين"
            data={topDrivers}
            suffix="طلب"
          />

          <ListCard
            title="🍽️ أكثر المطاعم نشاطاً"
            data={topRestaurants}
            suffix="د.ع"
            moneyMode
          />

          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-3xl font-black">
              🔥 Heat Map
            </h2>

            {areas.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-3">
                {areas.slice(0, 6).map((area, index) => (
                  <div
                    key={area.name}
                    className={`rounded-2xl p-4 font-black ${
                      index === 0
                        ? "bg-red-100 text-red-700"
                        : index === 1
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {index === 0 ? "🔴" : index === 1 ? "🟡" : "🟢"}{" "}
                    {area.name} — {area.value} طلب
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-3xl font-black">🚗 السائقين المتاحين</h2>

            {availableDrivers.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-3">
                {availableDrivers.map((driver) => (
                  <DriverCard key={driver.id} driver={driver} />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 text-black">
            <h2 className="mb-4 text-3xl font-black">📦 طلبات تحتاج متابعة</h2>

            {readyOrders.length === 0 && onDeliveryOrders.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto">
                {[...readyOrders, ...onDeliveryOrders].map((order) => (
                  <div key={order.id} className="rounded-2xl bg-gray-100 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-black">
                          {order.customerName || "زبون"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {order.restaurant || "مطعم غير محدد"}
                        </p>
                      </div>

                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold">
                        {order.status || "جديد"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm">
                      🚗 {order.driverName || "لم يحدد سائق"}
                    </p>

                    <p className="mt-1 text-sm">
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

function guessArea(address: string) {
  const text = address.toLowerCase();

  if (text.includes("زيونة")) return "زيونة";
  if (text.includes("المنصور")) return "المنصور";
  if (text.includes("الكرادة")) return "الكرادة";
  if (text.includes("الأعظمية") || text.includes("الاعظمية")) return "الأعظمية";
  if (text.includes("الجادرية")) return "الجادرية";
  if (text.includes("بغداد")) return "بغداد";

  return address ? "مناطق أخرى" : "غير محدد";
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
        className={`mt-2 text-2xl font-black ${
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

function ForecastCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-yellow-400 p-5 text-center">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  data,
  suffix,
  moneyMode,
}: {
  title: string;
  data: { name: string; value: number }[];
  suffix: string;
  moneyMode?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 text-black">
      <h2 className="mb-4 text-3xl font-black">{title}</h2>

      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex flex-col gap-3">
          {data.slice(0, 6).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between rounded-2xl bg-gray-100 p-4"
            >
              <p className="text-lg font-black">
                #{index + 1} {item.name}
              </p>

              <span className="rounded-full bg-yellow-400 px-4 py-2 font-black">
                {moneyMode ? money(item.value) : item.value} {suffix}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({ driver }: { driver: Driver }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4">
      <h3 className="text-xl font-black">{driver.name || driver.id}</h3>
      <p className="mt-1 text-sm">📞 {driver.phone || "لا يوجد رقم"}</p>
      <p className="mt-1 text-sm">
        🎯 الدقة:{" "}
        {driver.accuracy ? `${Math.round(driver.accuracy)} متر` : "غير محددة"}
      </p>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl bg-gray-100 p-5 text-center text-gray-500">
      لا توجد بيانات حالياً
    </div>
  );
}