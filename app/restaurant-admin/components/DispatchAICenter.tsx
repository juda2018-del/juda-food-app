"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Driver = {
  id: string;
  name?: string;
  phone?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: number;
};

type Order = {
  id: string;
  docId?: string;
  restaurant?: string;
  status?: string;
  customerName?: string;
  address?: string;
  total?: number;
  driverName?: string;
  createdAt?: any;
};

type DriverScore = {
  driver: Driver;
  score: number;
  reason: string;
  activeOrders: number;
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

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function driverKey(name?: string) {
  return String(name || "").trim();
}

export default function DispatchAICenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        docId: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

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

  const readyOrders = useMemo(() => {
    return orders.filter((order) => order.status === "جاهز للتوصيل");
  }, [orders]);

  const deliveringOrders = useMemo(() => {
    return orders.filter((order) => order.status === "قيد التوصيل");
  }, [orders]);

  const driverScores = useMemo(() => {
    const activeByDriver: Record<string, number> = {};

    deliveringOrders.forEach((order) => {
      const key = driverKey(order.driverName);
      if (!key) return;
      activeByDriver[key] = (activeByDriver[key] || 0) + 1;
    });

    const scores: DriverScore[] = drivers.map((driver) => {
      const key = driverKey(driver.name || driver.id);
      const activeOrders = activeByDriver[key] || 0;

      let score = 0;
      const reasons: string[] = [];

      if (isOnline(driver)) {
        score += 50;
        reasons.push("متصل");
      } else {
        reasons.push("غير متصل");
      }

      if (hasLocation(driver)) {
        score += 20;
        reasons.push("موقعه متاح");
      }

      if (activeOrders === 0) {
        score += 25;
        reasons.push("غير مشغول");
      } else {
        score -= activeOrders * 15;
        reasons.push(`عنده ${activeOrders} طلب`);
      }

      if (driver.lastSeen) {
        const minutes = Math.floor((Date.now() - driver.lastSeen) / 1000 / 60);
        if (minutes < 3) {
          score += 10;
          reasons.push("آخر ظهور قريب");
        }
      }

      return {
        driver,
        score: Math.max(score, 0),
        reason: reasons.join(" • "),
        activeOrders,
      };
    });

    return scores.sort((a, b) => b.score - a.score);
  }, [drivers, deliveringOrders]);

  const bestDriver = driverScores[0];

  const aiAlerts = useMemo(() => {
    const onlineDrivers = drivers.filter((driver) => isOnline(driver));
    const availableDrivers = driverScores.filter(
      (item) => isOnline(item.driver) && item.activeOrders === 0
    );

    const alerts: string[] = [];

    if (readyOrders.length > 0 && availableDrivers.length === 0) {
      alerts.push("⚠️ توجد طلبات جاهزة ولا يوجد سائق متاح");
    }

    if (onlineDrivers.length < 2) {
      alerts.push("⚠️ عدد السائقين المتصلين منخفض");
    }

    if (readyOrders.length >= 3) {
      alerts.push("🔥 ضغط توزيع عالي، يفضل تشغيل سائقين إضافيين");
    }

    if (bestDriver) {
      alerts.push(`✅ أفضل مرشح حالياً: ${bestDriver.driver.name || bestDriver.driver.id}`);
    }

    return alerts;
  }, [drivers, driverScores, readyOrders.length, bestDriver]);

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
          DISPATCH AI CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🧠 مركز التوزيع الذكي
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          اقتراح أفضل سائق للطلبات الجاهزة حسب الاتصال والانشغال وآخر ظهور
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
        <Card title="طلبات جاهزة" value={readyOrders.length} icon="✅" />
        <Card title="قيد التوصيل" value={deliveringOrders.length} icon="🛵" />
        <Card
          title="السائقون المتصلون"
          value={drivers.filter((driver) => isOnline(driver)).length}
          icon="🟢"
        />
        <Card
          title="أفضل سائق"
          value={bestDriver?.driver.name || bestDriver?.driver.id || "لا يوجد"}
          icon="🏆"
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 14,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.22)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🚚 ترتيب السائقين حسب FUSE AI
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {driverScores.length === 0 ? (
              <Empty text="لا توجد بيانات سائقين حالياً" />
            ) : (
              driverScores.slice(0, 8).map((item, index) => (
                <div
                  key={item.driver.id}
                  style={{
                    border: "1px solid rgba(255,255,255,.08)",
                    background:
                      index === 0
                        ? "rgba(255,122,0,.10)"
                        : "rgba(255,255,255,.03)",
                    borderRadius: 16,
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "1.3fr .7fr 1.4fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: "white",
                        fontWeight: 950,
                      }}
                    >
                      #{index + 1} 🛵 {item.driver.name || item.driver.id}
                    </p>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: isOnline(item.driver) ? "#86efac" : "#fca5a5",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      ● {isOnline(item.driver) ? "متصل" : "غير متصل"}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: "#a1a1aa",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      النقاط
                    </p>

                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#ffb347",
                        fontSize: 20,
                        fontWeight: 950,
                      }}
                    >
                      {item.score}
                    </p>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: "#d4d4d8",
                      fontSize: 12,
                      fontWeight: 800,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,122,0,.20)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🤖 توصيات التوزيع
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {aiAlerts.length === 0 ? (
              <Empty text="الوضع مستقر حالياً" />
            ) : (
              aiAlerts.map((alert, index) => (
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

          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 16,
              padding: 14,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#a1a1aa",
                fontWeight: 800,
              }}
            >
              أعلى طلب جاهز
            </p>

            <p
              style={{
                margin: "8px 0 0",
                color: "white",
                fontWeight: 950,
              }}
            >
              {readyOrders[0]?.customerName || "لا يوجد طلب جاهز"}
            </p>

            <p
              style={{
                margin: "6px 0 0",
                color: "#ffb347",
                fontWeight: 950,
              }}
            >
              {readyOrders[0] ? formatMoney(readyOrders[0].total) : ""}
            </p>
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

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,.12)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
        color: "#71717a",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}