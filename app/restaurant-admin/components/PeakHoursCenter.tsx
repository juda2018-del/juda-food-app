 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  status?: string;
  total?: number;
  createdAt?: any;
};

type HourStats = {
  hour: number;
  label: string;
  orders: number;
  delivered: number;
  revenue: number;
  drivers: number;
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

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function hourLabel(hour: number) {
  const next = hour + 1;

  const start = `${String(hour).padStart(2, "0")}:00`;
  const end = `${String(next).padStart(2, "0")}:00`;

  return `${start} - ${end}`;
}

export default function PeakHoursCenter() {
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

  const hours = useMemo(() => {
    const map: Record<number, HourStats> = {};

    orders.forEach((order) => {
      const date = toDate(order.createdAt);
      if (!date) return;

      const hour = date.getHours();

      if (!map[hour]) {
        map[hour] = {
          hour,
          label: hourLabel(hour),
          orders: 0,
          delivered: 0,
          revenue: 0,
          drivers: 0,
        };
      }

      map[hour].orders += 1;

      if (order.status === "تم التسليم") {
        map[hour].delivered += 1;
        map[hour].revenue += Number(order.total || 0);
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        drivers: Math.max(1, Math.ceil(item.orders / 12)),
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8);
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
          PEAK HOURS CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🔥 ساعات الذروة
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          تحليل حقيقي لأوقات الضغط حسب وقت إنشاء الطلبات في Firestore
        </p>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 14,
        }}
      >
        {hours.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,.12)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 20,
              padding: 22,
              textAlign: "center",
              color: "#71717a",
              fontWeight: 900,
            }}
          >
            لا توجد بيانات كافية لحساب ساعات الذروة
          </div>
        ) : (
          hours.map((hour, index) => (
            <div
              key={hour.hour}
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(0,0,0,.22)",
                borderRadius: 20,
                padding: 18,
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontWeight: 950,
                  }}
                >
                  {index === 0 ? "🔥" : "⏰"} {hour.label}
                </h3>

                <p
                  style={{
                    marginTop: 6,
                    color: "#71717a",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  ترتيب الذروة #{index + 1}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                  الطلبات
                </p>

                <p
                  style={{
                    marginTop: 8,
                    color: "#ffb347",
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {hour.orders}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                  المسلمة
                </p>

                <p
                  style={{
                    marginTop: 8,
                    color: "#86efac",
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {hour.delivered}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                  السائقون المطلوبون
                </p>

                <p
                  style={{
                    marginTop: 8,
                    color: "#93c5fd",
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {hour.drivers}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                  الإيرادات
                </p>

                <p
                  style={{
                    marginTop: 8,
                    color: "#facc15",
                    fontWeight: 950,
                  }}
                >
                  {formatMoney(hour.revenue)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}