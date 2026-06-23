 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
};

type Driver = {
  id: string;
  status?: string;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

export default function ExecutiveDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      setDrivers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Driver[]
      );
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.status === "تم التسليم"
    );

    const revenue = delivered.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const activeOrders = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "")
    );

    const onlineDrivers = drivers.filter(
      (driver) => driver.status === "متصل"
    ).length;

    const completionRate =
      orders.length > 0
        ? Math.round((delivered.length / orders.length) * 100)
        : 0;

    return {
      revenue,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      onlineDrivers,
      completionRate,
    };
  }, [orders, drivers]);

  const cards = [
    {
      title: "إيرادات اليوم",
      value: formatMoney(data.revenue),
      icon: "💰",
      color: "#ffb347",
    },
    {
      title: "كل الطلبات",
      value: data.totalOrders,
      icon: "📦",
      color: "#86efac",
    },
    {
      title: "السائقون المتصلون",
      value: data.onlineDrivers,
      icon: "🛵",
      color: "#93c5fd",
    },
    {
      title: "نسبة الإنجاز",
      value: `${data.completionRate}%`,
      icon: "⭐",
      color: "#facc15",
    },
  ];

  const alerts = [
    `🔥 الطلبات النشطة حالياً: ${data.activeOrders}`,
    `🛵 السائقون المتصلون: ${data.onlineDrivers}`,
    `💰 إجمالي الإيرادات: ${formatMoney(data.revenue)}`,
    `⭐ نسبة الإنجاز الحالية: ${data.completionRate}%`,
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
      <div>
        <p
          style={{
            margin: 0,
            color: "#ffb347",
            letterSpacing: 3,
            fontSize: 11,
            fontWeight: 950,
          }}
        >
          EXECUTIVE DASHBOARD
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          📊 لوحة الإدارة التنفيذية
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          ملخص شامل لأداء المطعم والطلبات والمبيعات
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 20,
              padding: 18,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#d4d4d8",
                fontWeight: 850,
              }}
            >
              {card.icon} {card.title}
            </p>

            <h3
              style={{
                marginTop: 14,
                color: card.color,
                fontSize: 26,
                fontWeight: 950,
              }}
            >
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 22,
          border: "1px solid rgba(255,122,0,.20)",
          background: "rgba(255,122,0,.08)",
          borderRadius: 20,
          padding: 18,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "white",
            fontWeight: 950,
          }}
        >
          🚨 أهم التنبيهات
        </h3>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gap: 10,
          }}
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 14,
                color: "#d4d4d8",
                fontWeight: 850,
              }}
            >
              {alert}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}