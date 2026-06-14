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

type OrderItem = {
  name: string;
  price: number;
  qty: number;
};

type Order = {
  docId: string;
  customerName?: string;
  phone?: string;
  address?: string;
  restaurant?: string;
  total?: number;
  status?: string;
  createdAt?: any;
  items?: OrderItem[];
};

const restaurantName = "فيروز";

const filters = [
  "الكل",
  "جديد",
  "قيد التحضير",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التسليم",
  "مرفوض",
];

function getStatusColor(status?: string) {
  if (status === "قيد التحضير") return "bg-blue-600 text-white";
  if (status === "جاهز للتوصيل") return "bg-green-600 text-white";
  if (status === "قيد التوصيل") return "bg-purple-600 text-white";
  if (status === "تم التسليم") return "bg-black text-white";
  if (status === "مرفوض") return "bg-red-600 text-white";
  return "bg-yellow-400 text-black";
}

function formatDate(createdAt: any) {
  if (!createdAt) return "لا يوجد وقت";

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return "لا يوجد وقت";

  return date.toLocaleString("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cleanPhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function whatsappPhone(phone?: string) {
  const cleaned = cleanPhone(phone);

  if (!cleaned) return "";
  if (cleaned.startsWith("964")) return cleaned;
  if (cleaned.startsWith("0")) return `964${cleaned.slice(1)}`;

  return cleaned;
}

export default function RestaurantAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const previousNewOrdersCount = useRef(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        ...item.data(),
        docId: item.id,
      })) as Order[];

      const restaurantOrders = data.filter(
        (order) => order.restaurant === restaurantName
      );

      const newCount = restaurantOrders.filter(
        (order) => (order.status || "جديد") === "جديد"
      ).length;

      if (!firstLoad.current && newCount > previousNewOrdersCount.current) {
        setNewOrderAlert(true);

        const audio = new Audio("/sounds/new-order.mp3.wav");
        audio.play().catch(() => {});

        setTimeout(() => {
          setNewOrderAlert(false);
        }, 8000);
      }

      previousNewOrdersCount.current = newCount;
      firstLoad.current = false;

      setOrders(restaurantOrders);
    });

    return () => unsub();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeFilter === "الكل") return orders;
    return orders.filter((order) => (order.status || "جديد") === activeFilter);
  }, [orders, activeFilter]);

  const newOrdersCount = orders.filter(
    (order) => (order.status || "جديد") === "جديد"
  ).length;

  const preparingOrdersCount = orders.filter(
    (order) => order.status === "قيد التحضير"
  ).length;

  const readyOrdersCount = orders.filter(
    (order) => order.status === "جاهز للتوصيل"
  ).length;

  const deliveringOrdersCount = orders.filter(
    (order) => order.status === "قيد التوصيل"
  ).length;

  const deliveredOrdersCount = orders.filter(
    (order) => order.status === "تم التسليم"
  ).length;

  const rejectedOrdersCount = orders.filter(
    (order) => order.status === "مرفوض"
  ).length;

  const todaySales = orders
    .filter((order) => order.status === "تم التسليم")
    .reduce((sum, order) => sum + (order.total || 0), 0);

  async function changeStatus(docId: string, status: string) {
    try {
      if (!docId) return;

      await updateDoc(doc(db, "orders", String(docId)), {
        status: String(status),
      });
    } catch (error) {
      console.error("خطأ تحديث الطلب:", error);
      alert("صار خطأ بتحديث الطلب، جرّب مرة ثانية");
    }
  }

  function printOrder(order: Order) {
    const itemsText =
      order.items
        ?.map(
          (item) =>
            `${item.name} × ${item.qty} = ${item.price * item.qty} د.ع`
        )
        .join("\n") || "لا توجد تفاصيل";

    const printText = `
FUSE - ${restaurantName}

الزبون: ${order.customerName || "زبون"}
الهاتف: ${order.phone || "لا يوجد رقم"}
العنوان: ${order.address || "لا يوجد عنوان"}
الوقت: ${formatDate(order.createdAt)}
الحالة: ${order.status || "جديد"}

الطلب:
${itemsText}

المجموع: ${order.total || 0} د.ع
`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة الطلب</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.8;
            }
            pre {
              white-space: pre-wrap;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <pre>${printText}</pre>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  function renderActionButtons(order: Order, status: string) {
    if (status === "جديد") {
      return (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => changeStatus(order.docId, "قيد التحضير")}
            className="rounded-2xl bg-blue-600 py-3 font-bold text-white"
          >
            قبول الطلب
          </button>

          <button
            onClick={() => changeStatus(order.docId, "مرفوض")}
            className="rounded-2xl bg-red-600 py-3 font-bold text-white"
          >
            رفض
          </button>
        </div>
      );
    }

    if (status === "قيد التحضير") {
      return (
        <div className="mt-4">
          <button
            onClick={() => changeStatus(order.docId, "جاهز للتوصيل")}
            className="w-full rounded-2xl bg-green-600 py-3 font-bold text-white"
          >
            الطلب جاهز للتوصيل
          </button>
        </div>
      );
    }

    if (status === "جاهز للتوصيل") {
      return (
        <div className="mt-4 rounded-2xl bg-green-100 p-3 text-center font-bold text-green-800">
          الطلب ينتظر السائق 🚚
        </div>
      );
    }

    if (status === "قيد التوصيل") {
      return (
        <div className="mt-4 rounded-2xl bg-purple-100 p-3 text-center font-bold text-purple-800">
          الطلب مع السائق 🚚
        </div>
      );
    }

    return null;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-3xl">
        {newOrderAlert && (
          <div className="mb-5 rounded-3xl bg-yellow-400 p-4 text-center text-xl font-black text-black shadow-2xl">
            🔔 وصل طلب جديد من فيوز
          </div>
        )}

        <h1 className="text-center text-3xl font-black text-yellow-400">
          لوحة مطعم {restaurantName}
        </h1>

        <p className="mt-2 text-center text-gray-300">
          الطلبات الخاصة بالمطعم فقط
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          <InfoCard title="كل الطلبات" value={orders.length} />
          <InfoCard title="طلبات جديدة" value={newOrdersCount} />
          <InfoCard title="قيد التحضير" value={preparingOrdersCount} />
          <InfoCard title="جاهزة للتوصيل" value={readyOrdersCount} />
          <InfoCard title="قيد التوصيل" value={deliveringOrdersCount} />
          <InfoCard title="تم التسليم" value={deliveredOrdersCount} />
          <InfoCard title="مرفوض" value={rejectedOrdersCount} />
          <div className="col-span-2 rounded-3xl bg-white/10 p-4 text-center md:col-span-2">
            <p className="text-sm text-gray-300">مبيعات اليوم</p>
            <p className="mt-1 text-3xl font-black text-yellow-400">
              {todaySales} د.ع
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`min-w-fit rounded-full px-4 py-2 text-sm font-bold ${
                activeFilter === filter
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl bg-white/10 p-6 text-center text-gray-300">
              لا توجد طلبات في هذا القسم حالياً
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = order.status || "جديد";
              const phoneForCall = cleanPhone(order.phone);
              const phoneForWhatsapp = whatsappPhone(order.phone);

              return (
                <div
                  key={order.docId}
                  className="rounded-3xl bg-white p-5 text-black shadow-xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black">
                      {order.customerName || "زبون"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${getStatusColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    🕒 {formatDate(order.createdAt)}
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    📞 {order.phone || "لا يوجد رقم"}
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    📍 {order.address || "لا يوجد عنوان"}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {phoneForCall && (
                      <a
                        href={`tel:${phoneForCall}`}
                        className="rounded-2xl bg-purple-600 py-3 text-center text-sm font-bold text-white"
                      >
                        اتصال
                      </a>
                    )}

                    {phoneForWhatsapp && (
                      <a
                        href={`https://wa.me/${phoneForWhatsapp}`}
                        target="_blank"
                        className="rounded-2xl bg-green-500 py-3 text-center text-sm font-bold text-white"
                      >
                        واتساب
                      </a>
                    )}

                    <button
                      onClick={() => printOrder(order)}
                      className="rounded-2xl bg-gray-800 py-3 text-center text-sm font-bold text-white"
                    >
                      طباعة
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-gray-100 p-3">
                    <p className="mb-2 font-bold">الطلب:</p>

                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between border-b py-2 text-sm last:border-b-0"
                        >
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <span>{item.price * item.qty} د.ع</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        لا توجد تفاصيل للطلب
                      </p>
                    )}
                  </div>

                  <div className="mt-4 text-lg font-black">
                    المجموع: {order.total || 0} د.ع
                  </div>

                  {renderActionButtons(order, status)}
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white/10 p-4 text-center">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="mt-1 text-3xl font-black text-yellow-400">{value}</p>
    </div>
  );
}