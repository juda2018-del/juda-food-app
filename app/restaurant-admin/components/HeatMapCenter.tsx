 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  address?: string;
  status?: string;
  total?: number;
};

type AreaStats = {
  name: string;
  orders: number;
  delivered: number;
  rejected: number;
  active: number;
  revenue: number;
  rate: number;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function cleanArea(address?: string) {
  if (!address) return "غير محدد";

  const text = address.trim();

  if (text.includes("زيونة")) return "زيونة";
  if (text.includes("الكرادة")) return "الكرادة";
  if (text.includes("المنصور")) return "المنصور";
  if (text.includes("الجادرية")) return "الجادرية";
  if (text.includes("الغدير")) return "الغدير";
  if (text.includes("اليرموك")) return "اليرموك";
  if (text.includes("الحارثية")) return "الحارثية";
  if (text.includes("الأعظمية") || text.includes("الاعظمية")) return "الأعظمية";
  if (text.includes("البلديات")) return "البلديات";
  if (text.includes("بغداد الجديدة")) return "بغداد الجديدة";
  if (text.includes("شارع فلسطين")) return "شارع فلسطين";

  return text.split(" ")[0] || "غير محدد";
}

function areaColor(index: number) {
  const colors = ["#ff7a00", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
  return colors[index % colors.length];
}

export default function HeatMapCenter() {
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
    const map: Record<string, AreaStats> = {};

    orders.forEach((order) => {
      const area = cleanArea(order.address);

      if (!map[area]) {
        map[area] = {
          name: area,
          orders: 0,
          delivered: 0,
          rejected: 0,
          active: 0,
          revenue: 0,
          rate: 0,
        };
      }

      map[area].orders += 1;

      if (order.status === "تم التسليم") {
        map[area].delivered += 1;
        map[area].revenue += Number(order.total || 0);
      } else if (order.status === "مرفوض") {
        map[area].rejected += 1;
      } else {
        map[area].active += 1;
      }
    });

    const total = orders.length || 1;

    const areas = Object.values(map)
      .map((item) => ({
        ...item,
        rate: Math.round((item.orders / total) * 100),
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    const topArea = areas[0];
    const totalRevenue = areas.reduce((sum, area) => sum + area.revenue, 0);
    const activeAreas = areas.filter((area) => area.active > 0).length;

    const alerts: string[] = [];

    if (topArea) alerts.push(`🔥 أقوى منطقة حالياً: ${topArea.name}`);
    if (activeAreas > 2) alerts.push("📍 توجد عدة مناطق بيها طلبات نشطة");
    if (topArea && topArea.rate > 45) alerts.push("⚠️ الطلبات مركزة بمنطقة واحدة، راقب توزيع السائقين");
    if (areas.length === 0) alerts.push("لا توجد بيانات مناطق حالياً");

    return {
      areas,
      topArea,
      totalRevenue,
      activeAreas,
      alerts,
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
          HEAT MAP CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          📍 خريطة الطلبات
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          تحليل حقيقي لأكثر المناطق نشاطاً من عناوين الطلبات.
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
        <Card title="عدد المناطق" value={data.areas.length} icon="📍" />
        <Card title="أقوى منطقة" value={data.topArea?.name || "لا يوجد"} icon="🔥" />
        <Card title="مناطق نشطة" value={data.activeAreas} icon="🚚" />
        <Card title="إيرادات المناطق" value={formatMoney(data.totalRevenue)} icon="💰" />
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          {data.areas.length === 0 ? (
            <Empty text="لا توجد بيانات مناطق حالياً" />
          ) : (
            data.areas.map((area, index) => (
              <AreaRow key={area.name} area={area} index={index} />
            ))
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
            🧠 تنبيهات المناطق
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {data.alerts.map((alert, index) => (
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
            ))}

            <div
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
                lineHeight: 1.7,
              }}
            >
              🛵 وجّه السائقين قريباً من المناطق الأعلى طلباً قبل وقت الذروة.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AreaRow({ area, index }: { area: AreaStats; index: number }) {
  const color = areaColor(index);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "white",
            fontWeight: 950,
          }}
        >
          #{index + 1} 📍 {area.name}
        </h3>

        <span
          style={{
            color: "#ffb347",
            fontWeight: 950,
          }}
        >
          {area.orders} طلب
        </span>
      </div>

      <div
        style={{
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            width: `${area.rate}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 10,
        }}
      >
        <Mini title="نسبة الطلبات" value={`${area.rate}%`} />
        <Mini title="طلبات مسلمة" value={area.delivered} />
        <Mini title="نشطة" value={area.active} />
        <Mini title="مرفوضة" value={area.rejected} />
        <Mini title="الإيرادات" value={formatMoney(area.revenue)} />
      </div>
    </div>
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
          fontSize: 20,
          fontWeight: 950,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Mini({ title, value }: { title: string; value: string | number }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.18)",
        borderRadius: 14,
        padding: 10,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#71717a",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {title}
      </p>

      <p
        style={{
          margin: "6px 0 0",
          color: "#d4d4d8",
          fontSize: 13,
          fontWeight: 950,
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