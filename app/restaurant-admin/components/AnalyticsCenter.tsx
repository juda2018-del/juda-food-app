"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

const restaurantName = "فيروز";

function toDate(value: any) {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") return value.toDate();

    const date = new Date(value);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}

function isToday(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(value: any) {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function percent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export default function AnalyticsCenter() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const totalOrders = orders.length;
    const todayOrders = orders.filter((order) => isToday(order.createdAt));
    const weekOrders = orders.filter((order) => isThisWeek(order.createdAt));

    const deliveredOrders = orders.filter(
      (order) => order.status === "تم التسليم"
    );

    const rejectedOrders = orders.filter(
      (order) => order.status === "مرفوض"
    );

    const newOrders = orders.filter(
      (order) => (order.status || "جديد") === "جديد"
    );

    const preparingOrders = orders.filter(
      (order) => order.status === "قيد التحضير"
    );

    const readyOrders = orders.filter(
      (order) => order.status === "جاهز للتوصيل"
    );

    const deliveringOrders = orders.filter(
      (order) => order.status === "قيد التوصيل"
    );

    const todayRevenue = todayOrders
      .filter((order) => order.status === "تم التسليم")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);

    const successRate = percent(deliveredOrders.length, totalOrders);
    const cancelRate = percent(rejectedOrders.length, totalOrders);

    return {
      totalOrders,
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      deliveredOrders: deliveredOrders.length,
      rejectedOrders: rejectedOrders.length,
      newOrders: newOrders.length,
      preparingOrders: preparingOrders.length,
      readyOrders: readyOrders.length,
      deliveringOrders: deliveringOrders.length,
      todayRevenue,
      successRate,
      cancelRate,
    };
  }, [orders]);

  const stats = [
    {
      title: "إيرادات اليوم",
      value: formatMoney(data.todayRevenue),
      icon: "💰",
    },
    {
      title: "طلبات اليوم",
      value: data.todayOrders,
      icon: "📦",
    },
    {
      title: "طلبات الأسبوع",
      value: data.weekOrders,
      icon: "📈",
    },
    {
      title: "معدل التسليم",
      value: `${data.successRate}%`,
      icon: "✅",
    },
    {
      title: "معدل الإلغاء",
      value: `${data.cancelRate}%`,
      icon: "❌",
    },
    {
      title: "طلبات جديدة",
      value: data.newOrders,
      icon: "🔥",
    },
    {
      title: "قيد التحضير",
      value: data.preparingOrders,
      icon: "👨‍🍳",
    },
    {
      title: "قيد التوصيل",
      value: data.deliveringOrders,
      icon: "🛵",
    },
  ];

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
      }}
    >
      <h2 style={{ margin: 0, color: "white", fontSize: 26, fontWeight: 950 }}>
        📈 مركز التحليلات
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        أداء المطعم الحقيقي من الطلبات والمبيعات ونسب التشغيل
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.title}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
              {item.icon} {item.title}
            </p>

            <p
              style={{
                marginTop: 12,
                color: "#ffb347",
                fontSize: 24,
                fontWeight: 950,
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}