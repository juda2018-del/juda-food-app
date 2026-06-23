 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string | number;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  driverName?: string;
  createdAt?: any;
};

const columns = [
  {
    title: "جديد",
    status: "جديد",
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-300",
  },
  {
    title: "قيد التحضير",
    status: "قيد التحضير",
    color: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-300",
  },
  {
    title: "جاهز للتوصيل",
    status: "جاهز للتوصيل",
    color: "bg-purple-100 text-purple-700",
    border: "border-purple-300",
  },
  {
    title: "قيد التوصيل",
    status: "قيد التوصيل",
    color: "bg-orange-100 text-orange-700",
    border: "border-orange-300",
  },
  {
    title: "تم التسليم",
    status: "تم التسليم",
    color: "bg-green-100 text-green-700",
    border: "border-green-300",
  },
];

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

function playNewOrderSound() {
  const audio = new Audio("/sounds/new-order.mp3.wav");
  audio.volume = 1;

  audio.play().catch((error) => {
    console.log("Audio Error:", error);
  });
}

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const firstLoad = useRef(true);
  const notifiedOrders = useRef<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        ...docItem.data(),
        id: docItem.id,
      })) as Order[];

      if (firstLoad.current) {
        notifiedOrders.current = data
          .filter((order) => (order.status || "جديد") === "جديد")
          .map((order) => String(order.id || ""));

        firstLoad.current = false;
        setOrders(data);
        return;
      }

      data.forEach((order) => {
        const status = order.status || "جديد";
        const orderId = String(order.id || "");

        if (status === "جديد" && !notifiedOrders.current.includes(orderId)) {
          notifiedOrders.current.push(orderId);

          setNewOrderAlert(true);
          playNewOrderSound();

          setTimeout(() => {
            setNewOrderAlert(false);
          }, 8000);
        }
      });

      setOrders(data);
    });

    return () => unsub();
  }, []);

  const filteredOrders = useMemo(() => {
    const key = search.trim();

    if (!key) return orders;

    return orders.filter((order) => {
      const text = `${order.customerName || ""} ${order.phone || ""} ${
        order.address || ""
      } ${order.restaurant || ""} ${order.driverName || ""}`;

      return text.includes(key);
    });
  }, [orders, search]);

  const activeOrders = filteredOrders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const deliveredOrders = filteredOrders.filter(
    (order) => order.status === "تم التسليم"
  );

  const rejectedOrders = filteredOrders.filter(
    (order) => order.status === "مرفوض"
  );

  const todaySales = deliveredOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  const activeTotal = activeOrders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );

  function getOrdersByStatus(status: string) {
    return filteredOrders.filter(
      (order) => (order.status || "جديد") === status
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-7xl">
        {newOrderAlert && (
          <div className="mb-5 rounded-3xl bg-yellow-400 p-4 text-center text-xl font-black text-black shadow-2xl">
            🔔 وصل طلب جديد
          </div>
        )}

        <h1 className="text-center text-4xl font-black text-yellow-400">
          غرفة العمليات المباشرة
        </h1>

        <p className="mt-2 text-center text-gray-300">
          لوحة موزعة حسب حالة الطلب مثل طلبات
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard title="الطلبات الحالية" value={activeOrders.length} />

          <StatCard
            title="قيمة الحالية"
            value={`${activeTotal.toLocaleString()} د.ع`}
            green
          />

          <StatCard title="تم التسليم" value={deliveredOrders.length} green />

          <StatCard
            title="مبيعات اليوم"
            value={`${todaySales.toLocaleString()} د.ع`}
            green
          />

          <StatCard title="مرفوض" value={rejectedOrders.length} red />
        </div>

        <div className="mt-6 rounded-3xl bg-white/10 p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الزبون، الهاتف، المطعم، العنوان، أو السائق"
            className="w-full rounded-2xl border border-white/20 bg-black p-4 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          {columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.status);

            return (
              <div
                key={column.status}
                className={`min-h-[500px] rounded-3xl border ${column.border} bg-white/10 p-3`}
              >
                <div
                  className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 font-black ${column.color}`}
                >
                  <span>{column.title}</span>
                  <span>{columnOrders.length}</span>
                </div>

                {columnOrders.length === 0 ? (
                  <div className="rounded-2xl bg-black/30 p-5 text-center text-sm text-gray-400">
                    لا توجد طلبات
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {columnOrders.map((order, index) => (
                      <OrderCard
                        key={`${String(order.id || "order")}-${index}`}
                        order={order}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
        className={`mt-2 text-2xl font-black md:text-3xl ${
          green ? "text-green-400" : red ? "text-red-400" : "text-yellow-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const orderId = String(order.id || "");

  return (
    <div className="rounded-2xl bg-white p-4 text-black shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-black">
            {order.customerName || "زبون"}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            #{orderId.slice(0, 6) || "طلب"}
          </p>
        </div>

        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
          {(order.total || 0).toLocaleString()} د.ع
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>🍽️ {order.restaurant || "مطعم غير محدد"}</p>
        <p>📞 {order.phone || "لا يوجد رقم"}</p>
        <p>📍 {order.address || "لا يوجد عنوان"}</p>
        <p>🕒 {formatDate(order.createdAt)}</p>

        {order.driverName && (
          <p className="font-bold text-orange-700">🚗 {order.driverName}</p>
        )}
      </div>
    </div>
  );
}