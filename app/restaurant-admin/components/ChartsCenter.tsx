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

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function getDate(createdAt: any) {
  if (!createdAt) return null;

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return null;
  return date;
}

export default function ChartsCenter() {
  const [orders, setOrders] = useState<Order[]>([]);

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

  const data = useMemo(() => {
    const delivered = orders.filter((order) => order.status === "تم التسليم");
    const rejected = orders.filter((order) => order.status === "مرفوض");
    const active = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "جديد")
    );

    const revenue = delivered.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const avgOrder =
      delivered.length > 0 ? Math.round(revenue / delivered.length) : 0;

    const completionRate =
      orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0;

    const rejectionRate =
      orders.length > 0 ? Math.round((rejected.length / orders.length) * 100) : 0;

    const hourlyMap: Record<number, number> = {};
    delivered.forEach((order) => {
      const date = getDate(order.createdAt);
      if (!date) return;
      const hour = date.getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    });

    const hourlyChart = Array.from({ length: 8 }).map((_, index) => {
      const hour = 12 + index;
      const value = hourlyMap[hour] || 0;
      const max = Math.max(...Object.values(hourlyMap), 1);

      return {
        label: `${hour}`,
        value,
        percent: Math.max(Math.round((value / max) * 100), value > 0 ? 8 : 3),
      };
    });

    const charts = [
      {
        title: "كل الطلبات",
        value: orders.length,
        icon: "📦",
        progress: Math.min(orders.length * 4, 100),
      },
      {
        title: "إيرادات اليوم",
        value: formatMoney(revenue),
        icon: "💰",
        progress: Math.min(Math.round(revenue / 20000), 100),
      },
      {
        title: "نسبة الإنجاز",
        value: `${completionRate}%`,
        icon: "📈",
        progress: completionRate,
      },
      {
        title: "نسبة الرفض",
        value: `${rejectionRate}%`,
        icon: "⚠️",
        progress: rejectionRate,
      },
    ];

    return {
      charts,
      hourlyChart,
      activeOrders: active.length,
      deliveredOrders: delivered.length,
      rejectedOrders: rejected.length,
      revenue,
      avgOrder,
      completionRate,
      rejectionRate,
    };
  }, [orders]);

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
          CHARTS CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          📊 مركز الرسوم البيانية
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          تحليل الأداء والمبيعات والطلبات حسب بيانات Firestore المباشرة.
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 14,
        }}
      >
        {data.charts.map((chart) => (
          <div
            key={chart.title}
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
              {chart.icon} {chart.title}
            </p>

            <h3
              style={{
                marginTop: 10,
                color: "#ffb347",
                fontSize: 28,
                fontWeight: 950,
              }}
            >
              {chart.value}
            </h3>

            <div
              style={{
                marginTop: 14,
                height: 10,
                borderRadius: 999,
                background: "rgba(255,255,255,.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(chart.progress, 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#ff7a00,#ffb347)",
                  borderRadius: 999,
                }}
              />
            </div>

            <p
              style={{
                marginTop: 8,
                color: "#71717a",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              نسبة الأداء {Math.min(chart.progress, 100)}%
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.22)",
          borderRadius: 20,
          padding: 18,
        }}
      >
        <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
          ⏱️ توزيع الطلبات حسب الساعة
        </h3>

        <div
          style={{
            marginTop: 16,
            height: 180,
            display: "grid",
            gridTemplateColumns: `repeat(${data.hourlyChart.length}, 1fr)`,
            gap: 10,
            alignItems: "end",
          }}
        >
          {data.hourlyChart.map((item) => (
            <div key={item.label} style={{ display: "grid", gap: 8, height: "100%" }}>
              <div
                style={{
                  height: `${item.percent}%`,
                  borderRadius: 999,
                  background: "linear-gradient(180deg,#ffb347,#ff7a00)",
                }}
              />
              <p
                style={{
                  margin: 0,
                  color: "#a1a1aa",
                  fontSize: 10,
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}