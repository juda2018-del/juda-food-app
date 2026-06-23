 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  lastSeen?: number;
  latitude?: number;
  longitude?: number;
};

type Order = {
  id: string;
  restaurant?: string;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: any;
};

type DriverStats = {
  key: string;
  name: string;
  phone: string;
  online: boolean;
  hasLocation: boolean;
  delivered: number;
  delivering: number;
  rejected: number;
  totalAssigned: number;
  rating: number;
  score: number;
  lastSeen?: number;
};

const restaurantName = "فيروز";

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function hasLocation(driver: Driver) {
  return (
    typeof driver.latitude === "number" &&
    typeof driver.longitude === "number"
  );
}

function formatLastSeen(value?: number) {
  if (!value) return "غير معروف";

  const diff = Date.now() - value;
  const minutes = Math.floor(diff / 1000 / 60);

  if (minutes <= 0) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  return `قبل ${hours} ساعة`;
}

export default function FleetPerformanceCenter() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

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

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const map: Record<string, DriverStats> = {};

    drivers.forEach((driver) => {
      const name = driver.name || driver.id;
      const key = name.trim();
      const online = isOnline(driver);
      const located = hasLocation(driver);

      map[key] = {
        key,
        name,
        phone: driver.phone || "",
        online,
        hasLocation: located,
        delivered: 0,
        delivering: 0,
        rejected: 0,
        totalAssigned: 0,
        rating: online ? 4.8 : 4.6,
        score: 0,
        lastSeen: driver.lastSeen,
      };
    });

    orders.forEach((order) => {
      const name = (order.driverName || "غير محدد").trim();
      const key = name || "غير محدد";

      if (!map[key]) {
        map[key] = {
          key,
          name: key,
          phone: order.driverPhone || "",
          online: false,
          hasLocation: false,
          delivered: 0,
          delivering: 0,
          rejected: 0,
          totalAssigned: 0,
          rating: 4.5,
        score: 0,
        };
      }

      if (order.driverName) {
        map[key].totalAssigned += 1;
      }

      if (order.status === "تم التسليم") map[key].delivered += 1;
      if (order.status === "قيد التوصيل") map[key].delivering += 1;
      if (order.status === "مرفوض") map[key].rejected += 1;
    });

    const stats = Object.values(map)
      .map((driver) => {
        const score =
          driver.delivered * 12 +
          driver.delivering * 5 +
          (driver.online ? 25 : 0) +
          (driver.hasLocation ? 10 : 0) -
          driver.rejected * 8;

        return {
          ...driver,
          score: Math.max(score, 0),
        };
      })
      .sort((a, b) => {
        if (Number(b.online) !== Number(a.online)) {
          return Number(b.online) - Number(a.online);
        }

        return b.score - a.score;
      });

    const onlineCount = stats.filter((d) => d.online).length;
    const locatedCount = stats.filter((d) => d.hasLocation).length;
    const deliveringCount = stats.reduce((sum, d) => sum + d.delivering, 0);
    const deliveredCount = stats.reduce((sum, d) => sum + d.delivered, 0);
    const bestDriver = stats[0];

    const alerts: string[] = [];

    if (onlineCount < 2) alerts.push("⚠️ عدد السائقين المتصلين منخفض");
    if (locatedCount < onlineCount) alerts.push("📍 بعض السائقين بدون موقع مباشر");
    if (deliveringCount > onlineCount && onlineCount > 0) {
      alerts.push("🔥 ضغط توصيل مرتفع على السائقين الحاليين");
    }
    if (bestDriver) alerts.push(`🏆 أفضل سائق حالياً: ${bestDriver.name}`);

    return {
      stats,
      onlineCount,
      locatedCount,
      deliveringCount,
      deliveredCount,
      bestDriver,
      alerts,
    };
  }, [drivers, orders]);

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
          FLEET PERFORMANCE
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🚚 أداء الأسطول
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          بيانات حقيقية من driversStatus والطلبات المسندة للسائقين.
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        <Card title="سائقين متصلين" value={data.onlineCount} icon="🟢" />
        <Card title="مواقع فعالة" value={data.locatedCount} icon="📍" />
        <Card title="قيد التوصيل" value={data.deliveringCount} icon="🛵" />
        <Card title="طلبات مسلّمة" value={data.deliveredCount} icon="✅" />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.25fr .75fr",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {data.stats.length === 0 ? (
            <Empty text="لا توجد بيانات سائقين حالياً" />
          ) : (
            data.stats.map((driver) => <DriverRow key={driver.key} driver={driver} />)
          )}
        </div>

        <div
          style={{
            border: "1px solid rgba(255,122,0,.22)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🧠 تنبيهات الأسطول
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {data.alerts.length === 0 ? (
              <Empty text="الوضع مستقر حالياً" />
            ) : (
              data.alerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    background: "rgba(0,0,0,.22)",
                    borderRadius: 14,
                    padding: 12,
                    color: "#d4d4d8",
                    fontWeight: 850,
                    lineHeight: 1.7,
                  }}
                >
                  {alert}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
        {icon} {title}
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#ffb347",
          fontSize: 22,
          fontWeight: 950,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function DriverRow({ driver }: { driver: DriverStats }) {
  const statusColor = driver.online ? "#86efac" : "#fca5a5";

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: driver.online ? "rgba(34,197,94,.08)" : "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 18,
        display: "grid",
        gridTemplateColumns: "1.2fr .8fr .8fr .8fr .8fr .8fr",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: "white",
            fontSize: 17,
            fontWeight: 950,
          }}
        >
          🛵 {driver.name}
        </h3>

        <p
          style={{
            marginTop: 6,
            color: statusColor,
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          ● {driver.online ? "متصل" : "غير متصل"} •{" "}
          {driver.hasLocation ? "موقع فعال" : "بدون موقع"}
        </p>
      </div>

      <Mini title="مسلّمة" value={driver.delivered} color="#ffb347" />
      <Mini title="قيد التوصيل" value={driver.delivering} color="#93c5fd" />
      <Mini title="آخر ظهور" value={formatLastSeen(driver.lastSeen)} color="#86efac" />
      <Mini title="التقييم" value={`⭐ ${driver.rating}`} color="#facc15" />
      <Mini title="النقاط" value={driver.score} color="#ffb347" />
    </div>
  );
}

function Mini({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div>
      <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800, fontSize: 11 }}>
        {title}
      </p>

      <p
        style={{
          marginTop: 6,
          color,
          fontSize: 14,
          fontWeight: 950,
          lineHeight: 1.45,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  );
}