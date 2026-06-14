 "use client";

import { useEffect, useMemo, useState } from "react";
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
  documentId: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
};

type DriverStatus = {
  id: string;
  name?: string;
  phone?: string;
  status?: "متصل" | "غير متصل";
  lastSeen?: number;
};

const drivers = ["محمد علي", "حيدر كريم"];

export default function FuseAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [driversStatus, setDriversStatus] = useState<DriverStatus[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => {
        const orderData = item.data();

        return {
          ...orderData,
          documentId: item.id,
        } as Order;
      });

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

      setDriversStatus(data);
    });

    return () => unsub();
  }, []);

  function getOnlineDriver() {
    const onlineDrivers = driversStatus.filter(
      (driver) => driver.status === "متصل"
    );

    if (onlineDrivers.length === 0) {
      return null;
    }

    return onlineDrivers[0];
  }

  async function updateOrderStatus(documentId: string, status: string) {
    if (!documentId) {
      alert("ما لكيت رقم الطلب");
      return;
    }

    await updateDoc(doc(db, "orders", documentId), {
      status,
    });
  }

  async function makeOrderReady(documentId: string) {
    if (!documentId) {
      alert("ما لكيت رقم الطلب");
      return;
    }

    const onlineDriver = getOnlineDriver();

    if (!onlineDriver?.name) {
      await updateDoc(doc(db, "orders", documentId), {
        status: "جاهز",
        driverName: "",
      });

      alert("ماكو سائق متصل حالياً، الطلب صار جاهز بدون إسناد");
      return;
    }

    await updateDoc(doc(db, "orders", documentId), {
      status: "جاهز للتوصيل",
      driverName: onlineDriver.name,
    });

    alert(`تم إسناد الطلب تلقائياً إلى ${onlineDriver.name}`);
  }

  async function assignDriver(documentId: string, driverName: string) {
    if (!documentId) {
      alert("ما لكيت رقم الطلب");
      return;
    }

    await updateDoc(doc(db, "orders", documentId), {
      driverName,
      status: "جاهز للتوصيل",
    });

    alert(`تم إسناد الطلب إلى ${driverName}`);
  }

  const stats = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => (o.status || "جديد") === "جديد").length,
      preparing: orders.filter((o) => o.status === "قيد التحضير").length,
      ready: orders.filter((o) => o.status === "جاهز").length,
      readyDelivery: orders.filter((o) => o.status === "جاهز للتوصيل").length,
      picked: orders.filter((o) => o.status === "استلم السائق الطلب").length,
      onWay: orders.filter((o) => o.status === "بالطريق").length,
      delivered: orders.filter((o) => o.status === "تم التسليم").length,
      rejected: orders.filter((o) => o.status === "مرفوض").length,
      sales: orders
        .filter((o) => o.status === "تم التسليم")
        .reduce((sum, o) => sum + (o.total || 0), 0),
    };
  }, [orders]);

  const onlineDriversCount = driversStatus.filter(
    (driver) => driver.status === "متصل"
  ).length;

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-center text-4xl font-black text-yellow-400">
          لوحة إدارة FUSE
        </h1>

        <p className="mt-2 text-center text-gray-300">
          الإدارة العامة للطلبات والمطاعم والسائقين
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card title="كل الطلبات" value={stats.all} />
          <Card title="جديدة" value={stats.new} />
          <Card title="قيد التحضير" value={stats.preparing} />
          <Card title="جاهزة" value={stats.ready} />
          <Card title="جاهزة للتوصيل" value={stats.readyDelivery} />
          <Card title="استلمها السائق" value={stats.picked} />
          <Card title="بالطريق" value={stats.onWay} />
          <Card title="تم التسليم" value={stats.delivered} />
          <Card title="السائقين المتصلين" value={onlineDriversCount} />
          <Card title="مرفوضة" value={stats.rejected} />
          <Card
            title="المبيعات"
            value={`${stats.sales.toLocaleString()} د.ع`}
            wide
          />
        </div>

        <div className="mt-8 rounded-3xl bg-white/10 p-4">
          <h2 className="mb-4 text-2xl font-black text-yellow-400">
            جميع الطلبات
          </h2>

          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div
                key={order.documentId}
                className="rounded-2xl bg-white p-4 text-black"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">
                      {order.restaurant || "مطعم غير معروف"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.customerName || "زبون"} - {order.phone || ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold">
                    {order.status || "جديد"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-700">
                  📍 {order.address || "لا يوجد عنوان"}
                </p>

                <p className="mt-2 font-black">
                  المجموع: {(order.total || 0).toLocaleString()} د.ع
                </p>

                <p className="mt-2 text-sm font-bold text-blue-700">
                  السائق: {order.driverName || "غير محدد"}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <button
                    onClick={() =>
                      updateOrderStatus(order.documentId, "قيد التحضير")
                    }
                    className="rounded-xl bg-orange-500 px-3 py-2 font-bold text-white"
                  >
                    قيد التحضير
                  </button>

                  <button
                    onClick={() => makeOrderReady(order.documentId)}
                    className="rounded-xl bg-blue-600 px-3 py-2 font-bold text-white"
                  >
                    جاهز + إسناد تلقائي
                  </button>

                  <button
                    onClick={() =>
                      updateOrderStatus(order.documentId, "تم التسليم")
                    }
                    className="rounded-xl bg-green-600 px-3 py-2 font-bold text-white"
                  >
                    تم التسليم
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.documentId, "مرفوض")}
                    className="rounded-xl bg-red-600 px-3 py-2 font-bold text-white"
                  >
                    رفض
                  </button>
                </div>

                <div className="mt-3">
                  <p className="mb-2 text-sm font-black">إسناد يدوي للسائق</p>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {drivers.map((driver) => (
                      <button
                        key={driver}
                        onClick={() => assignDriver(order.documentId, driver)}
                        className="rounded-xl bg-black px-3 py-2 font-bold text-white"
                      >
                        {driver}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  value,
  wide,
}: {
  title: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl bg-white/10 p-4 text-center ${
        wide ? "col-span-2 md:col-span-2" : ""
      }`}
    >
      <p className="text-sm text-gray-300">{title}</p>
      <p className="mt-1 text-3xl font-black text-yellow-400">{value}</p>
    </div>
  );
}