 "use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

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
  restaurant?: string;
  customerName?: string;
  driverName?: string;
  status?: string;
  total?: number;
  address?: string;
  createdAt?: any;
};

const restaurantName = "فيروز";
const restaurantPosition: [number, number] = [33.2965, 44.4445];

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

function driverKey(value?: string) {
  return String(value || "").trim();
}

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} د.ع`;
}

function lastSeenText(lastSeen?: number) {
  if (!lastSeen) return "غير معروف";
  const minutes = Math.floor((Date.now() - lastSeen) / 1000 / 60);
  if (minutes <= 0) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  return `قبل ${Math.floor(minutes / 60)} ساعة`;
}

export default function LiveMapCenter() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

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
    const readyOrders = orders.filter((order) => order.status === "جاهز للتوصيل");
    const deliveringOrders = orders.filter((order) => order.status === "قيد التوصيل");

    const activeByDriver: Record<string, number> = {};
    deliveringOrders.forEach((order) => {
      const key = driverKey(order.driverName);
      if (!key) return;
      activeByDriver[key] = (activeByDriver[key] || 0) + 1;
    });

    const mappedDrivers = drivers.map((driver) => {
      const key = driverKey(driver.name || driver.id);
      const activeOrders = activeByDriver[key] || 0;

      return {
        ...driver,
        online: isOnline(driver),
        located: hasLocation(driver),
        activeOrders,
      };
    });

    const onlineDrivers = mappedDrivers.filter((driver) => driver.online);
    const locatedDrivers = mappedDrivers.filter((driver) => driver.located);
    const freeDrivers = mappedDrivers.filter(
      (driver) => driver.online && driver.located && driver.activeOrders === 0
    );

    const bestDriver = freeDrivers[0] || onlineDrivers[0] || mappedDrivers[0];

    const alerts: string[] = [];

    if (readyOrders.length > 0 && freeDrivers.length === 0) {
      alerts.push("⚠️ توجد طلبات جاهزة ولا يوجد سائق حر حالياً");
    }

    if (onlineDrivers.length < 2) {
      alerts.push("⚠️ عدد السائقين المتصلين منخفض");
    }

    if (locatedDrivers.length < onlineDrivers.length) {
      alerts.push("📍 بعض السائقين متصلين لكن الموقع غير ظاهر");
    }

    if (readyOrders.length >= 3) {
      alerts.push("🔥 ضغط توصيل عالي، يفضل تحريك سائقين للمنطقة");
    }

    if (bestDriver) {
      alerts.push(`🏆 أفضل مرشح للتوزيع الآن: ${bestDriver.name || bestDriver.id}`);
    }

    return {
      readyOrders,
      deliveringOrders,
      mappedDrivers,
      onlineDrivers,
      locatedDrivers,
      freeDrivers,
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
          LIVE MAP CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🗺️ الخريطة المباشرة
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          متابعة السائقين، الطلبات الجاهزة، التوصيل، ومناطق الضغط لحظة بلحظة.
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 12,
        }}
      >
        <Card title="السائقون المتصلون" value={data.onlineDrivers.length} icon="🟢" />
        <Card title="مواقع فعالة" value={data.locatedDrivers.length} icon="📍" />
        <Card title="سائقين أحرار" value={data.freeDrivers.length} icon="🛵" />
        <Card title="طلبات جاهزة" value={data.readyOrders.length} icon="✅" />
        <Card title="قيد التوصيل" value={data.deliveringOrders.length} icon="🚚" />
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 14,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.25)",
            position: "relative",
          }}
        >
          <MapContainer
            center={restaurantPosition}
            zoom={13}
            style={{
              width: "100%",
              height: 520,
              background: "#111",
            }}
          >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Marker position={restaurantPosition}>
              <Popup>🏠 مطعم {restaurantName}</Popup>
            </Marker>

            {data.mappedDrivers
              .filter((driver) => driver.located)
              .map((driver) => (
                <Marker
                  key={driver.id}
                  position={[driver.latitude!, driver.longitude!]}
                >
                  <Popup>
                    🛵 {driver.name || driver.id}
                    <br />
                    الحالة: {driver.online ? "متصل" : "غير متصل"}
                    <br />
                    الطلبات الحالية: {driver.activeOrders}
                    <br />
                    آخر ظهور: {lastSeenText(driver.lastSeen)}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              left: 16,
              zIndex: 500,
              border: "1px solid rgba(255,122,0,.24)",
              background: "rgba(0,0,0,.65)",
              backdropFilter: "blur(10px)",
              borderRadius: 18,
              padding: 14,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
                أفضل مرشح الآن
              </p>

              <h3 style={{ margin: "6px 0 0", color: "white", fontSize: 18, fontWeight: 950 }}>
                {data.bestDriver?.name || data.bestDriver?.id || "لا يوجد سائق"}
              </h3>

              <p style={{ margin: "5px 0 0", color: "#71717a", fontSize: 11, fontWeight: 800 }}>
                حسب الاتصال، الموقع، وعدد الطلبات الحالية.
              </p>
            </div>

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "linear-gradient(135deg, #ff7a00, #ffb347)",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 950,
              }}
            >
              🏆
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <Panel title="🚨 تنبيهات الحركة" items={data.alerts} />

          <div
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
              🛵 السائقين الآن
            </h3>

            <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
              {data.mappedDrivers.length === 0 ? (
                <Empty text="لا توجد بيانات سائقين" />
              ) : (
                data.mappedDrivers.slice(0, 8).map((driver) => (
                  <div
                    key={driver.id}
                    style={{
                      border: "1px solid rgba(255,255,255,.08)",
                      background: driver.online
                        ? "rgba(34,197,94,.08)"
                        : "rgba(239,68,68,.07)",
                      borderRadius: 15,
                      padding: 11,
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 10,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, color: "white", fontSize: 12, fontWeight: 950 }}>
                        {driver.name || driver.id}
                      </p>

                      <p
                        style={{
                          margin: "5px 0 0",
                          color: driver.online ? "#86efac" : "#fca5a5",
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        ● {driver.online ? "متصل" : "غير متصل"} •{" "}
                        {driver.located ? "موقع فعال" : "بدون موقع"} •{" "}
                        {lastSeenText(driver.lastSeen)}
                      </p>
                    </div>

                    <p style={{ margin: 0, color: "#ffb347", fontSize: 11, fontWeight: 950 }}>
                      {driver.activeOrders} طلب
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
              ✅ طلبات جاهزة للتوزيع
            </h3>

            <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
              {data.readyOrders.length === 0 ? (
                <Empty text="لا توجد طلبات جاهزة" />
              ) : (
                data.readyOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    style={{
                      background: "rgba(0,0,0,.22)",
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <p style={{ margin: 0, color: "white", fontSize: 12, fontWeight: 950 }}>
                      {order.customerName || "زبون"}
                    </p>

                    <p style={{ margin: "5px 0 0", color: "#ffb347", fontSize: 11, fontWeight: 900 }}>
                      {formatMoney(order.total)}
                    </p>

                    <p style={{ margin: "5px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
                      {order.address || "لا يوجد عنوان"}
                    </p>
                  </div>
                ))
              )}
            </div>
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
  value: number;
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
      <p
        style={{
          margin: 0,
          color: "#a1a1aa",
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {icon} {title}
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#ffb347",
          fontSize: 24,
          fontWeight: 950,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,122,0,.20)",
        background: "rgba(255,122,0,.08)",
        borderRadius: 20,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>{title}</h3>

      <div style={{ marginTop: 12, display: "grid", gap: 9 }}>
        {items.length === 0 ? (
          <Empty text="الوضع مستقر حالياً" />
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
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
        padding: 14,
        textAlign: "center",
        color: "#71717a",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}