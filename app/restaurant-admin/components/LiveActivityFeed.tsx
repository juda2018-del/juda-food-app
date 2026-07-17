"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  customerName?: string;
  status?: string;
  total?: number;
  driverName?: string;
  createdAt?: any;
};

type Driver = {
  id: string;
  name?: string;
  status?: string;
  lastSeen?: number;
};

type Activity = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  time: string;
  color: string;
};

const restaurantName = "فيروز";

function getDate(createdAt: any) {
  if (!createdAt) return null;

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return null;
  return date;
}

function formatTime(createdAt: any) {
  const date = getDate(createdAt);
  if (!date) return "الآن";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function activityByStatus(order: Order): Activity {
  const status = order.status || "جديد";
  const name = order.customerName || "زبون";

  if (status === "جديد") {
    return {
      id: order.id,
      icon: "🔥",
      title: `طلب جديد من ${name}`,
      desc: `قيمة الطلب ${formatMoney(order.total)} بانتظار القبول`,
      time: formatTime(order.createdAt),
      color: "#ff7a00",
    };
  }

  if (status === "قيد التحضير") {
    return {
      id: order.id,
      icon: "👨‍🍳",
      title: `بدأ تحضير طلب ${name}`,
      desc: "الطلب دخل المطبخ وقيد التجهيز",
      time: formatTime(order.createdAt),
      color: "#f59e0b",
    };
  }

  if (status === "جاهز للتوصيل") {
    return {
      id: order.id,
      icon: "✅",
      title: `طلب ${name} جاهز للتوصيل`,
      desc: "ينتظر الإسناد إلى سائق متاح",
      time: formatTime(order.createdAt),
      color: "#22c55e",
    };
  }

  if (status === "قيد التوصيل") {
    return {
      id: order.id,
      icon: "🛵",
      title: `السائق ${order.driverName || "غير محدد"} استلم الطلب`,
      desc: `طلب ${name} بالطريق إلى الزبون`,
      time: formatTime(order.createdAt),
      color: "#3b82f6",
    };
  }

  if (status === "تم التسليم") {
    return {
      id: order.id,
      icon: "🏁",
      title: `تم تسليم طلب ${name}`,
      desc: `تم احتساب ${formatMoney(order.total)} ضمن الإيرادات`,
      time: formatTime(order.createdAt),
      color: "#86efac",
    };
  }

  if (status === "مرفوض") {
    return {
      id: order.id,
      icon: "🚫",
      title: `تم رفض طلب ${name}`,
      desc: "يحتاج مراجعة سبب الرفض",
      time: formatTime(order.createdAt),
      color: "#ef4444",
    };
  }

  return {
    id: order.id,
    icon: "📦",
    title: `تحديث على طلب ${name}`,
    desc: `الحالة الحالية: ${status}`,
    time: formatTime(order.createdAt),
    color: "#ffb347",
  };
}

export default function LiveActivityFeed() {
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
    const activities = orders.slice(0, 10).map(activityByStatus);

    const onlineDrivers = drivers.filter((driver) => isOnline(driver));
    const offlineDrivers = drivers.filter((driver) => !isOnline(driver));

    const smartEvents: Activity[] = [];

    if (onlineDrivers.length < 2) {
      smartEvents.push({
        id: "drivers-low",
        icon: "⚠️",
        title: "عدد السائقين المتصلين منخفض",
        desc: `المتوفر الآن ${onlineDrivers.length} سائق فقط`,
        time: "الآن",
        color: "#f59e0b",
      });
    }

    if (offlineDrivers.length > 0) {
      smartEvents.push({
        id: "drivers-offline",
        icon: "📴",
        title: "سائقين غير متصلين",
        desc: `${offlineDrivers.length} سائق خارج الخدمة حالياً`,
        time: "الآن",
        color: "#ef4444",
      });
    }

    const readyOrders = orders.filter((order) => order.status === "جاهز للتوصيل");

    if (readyOrders.length > 0) {
      smartEvents.push({
        id: "ready-orders",
        icon: "🛵",
        title: "طلبات جاهزة تنتظر سائق",
        desc: `${readyOrders.length} طلب جاهز للتوزيع`,
        time: "الآن",
        color: "#22c55e",
      });
    }

    return {
      activities: [...smartEvents, ...activities].slice(0, 12),
      onlineDrivers: onlineDrivers.length,
      totalOrders: orders.length,
      readyOrders: readyOrders.length,
    };
  }, [orders, drivers]);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,.28)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 14,
          alignItems: "start",
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
            LIVE ACTIVITY FEED
          </p>

          <h2
            style={{
              margin: "8px 0 0",
              color: "white",
              fontSize: 26,
              fontWeight: 950,
            }}
          >
            🛰️ الأحداث المباشرة
          </h2>

          <p
            style={{
              marginTop: 8,
              color: "#a1a1aa",
              fontWeight: 800,
            }}
          >
            آخر حركة الطلبات والسائقين والتنبيهات الذكية لحظة بلحظة.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            minWidth: 170,
          }}
        >
          <Badge label="الطلبات" value={data.totalOrders} />
          <Badge label="سائقين متصلين" value={data.onlineDrivers} />
          <Badge label="جاهزة للتوزيع" value={data.readyOrders} />
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 10,
        }}
      >
        {data.activities.length === 0 ? (
          <Empty text="لا توجد أحداث حالياً" />
        ) : (
          data.activities.map((item) => (
            <div
              key={item.id}
              style={{
                border: `1px solid ${item.color}28`,
                background: "rgba(0,0,0,.22)",
                borderRadius: 18,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}35`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {item.icon}
              </div>

              <div>
                <h3
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#a1a1aa",
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>

              <span
                style={{
                  color: item.color,
                  fontSize: 11,
                  fontWeight: 950,
                  whiteSpace: "nowrap",
                }}
              >
                {item.time}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Badge({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,122,0,.25)",
        background: "rgba(255,122,0,.08)",
        borderRadius: 999,
        padding: "7px 12px",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        color: "#ffb347",
        fontSize: 11,
        fontWeight: 950,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,.12)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 18,
        padding: 18,
        textAlign: "center",
        color: "#71717a",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}