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

function getHourLabel(hour: number) {
  const next = hour + 1;
  return `${String(hour).padStart(2, "0")}:00 - ${String(next).padStart(
    2,
    "0"
  )}:00`;
}

export default function ForecastCenter() {
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

  const forecast = useMemo(() => {
    const deliveredOrders = orders.filter(
      (order) => order.status === "تم التسليم"
    );

    const activeOrders = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "جديد")
    );

    const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

    const revenue = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const avgOrderValue =
      deliveredOrders.length > 0 ? revenue / deliveredOrders.length : 0;

    const hourlyMap: Record<number, number> = {};
    const hourlyRevenue: Record<number, number> = {};

    deliveredOrders.forEach((order) => {
      const date = getDate(order.createdAt);
      if (!date) return;

      const hour = date.getHours();
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + Number(order.total || 0);
    });

    const busiestHour =
      Object.entries(hourlyMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "18";

    const nextPeak = getHourLabel(Number(busiestHour));

    const baseOrders = deliveredOrders.length || activeOrders.length || orders.length;
    const growthFactor =
      activeOrders.length >= 15
        ? 1.35
        : activeOrders.length >= 8
        ? 1.22
        : baseOrders >= 40
        ? 1.16
        : 1.08;

    const expectedOrders = Math.max(0, Math.round(baseOrders * growthFactor));

    const expectedRevenue = Math.round(expectedOrders * avgOrderValue);

    const completionRate =
      orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0;

    const rejectionRate =
      orders.length > 0 ? Math.round((rejectedOrders.length / orders.length) * 100) : 0;

    const demandLevel =
      expectedOrders >= 80
        ? "مرتفع جداً"
        : expectedOrders >= 45
        ? "مرتفع"
        : expectedOrders >= 20
        ? "متوسط"
        : "منخفض";

    const staffingNeed =
      expectedOrders >= 80
        ? "4 سائقين + مطبخ كامل"
        : expectedOrders >= 45
        ? "3 سائقين + دعم مطبخ"
        : expectedOrders >= 20
        ? "2 سائقين"
        : "سائق واحد يكفي";

    const alerts: string[] = [];

    if (expectedOrders > 80) alerts.push("🔥 ضغط مرتفع جداً متوقع اليوم");
    if (expectedRevenue > 1500000) alerts.push("💰 توقع إيرادات قوية");
    if (expectedOrders < 20) alerts.push("⚠️ النشاط أقل من المعتاد");
    if (activeOrders.length > 10) alerts.push("📦 الطلبات النشطة حالياً ترفع الضغط المتوقع");
    if (rejectionRate > 10) alerts.push("🚫 نسبة الرفض تحتاج متابعة");
    if (completionRate > 80) alerts.push("✅ الأداء العام ممتاز اليوم");

    const aiTips: string[] = [];

    aiTips.push("🧠 تجهيز المواد قبل وقت الذروة");
    aiTips.push(`⏱️ التركيز على فترة ${nextPeak}`);

    if (expectedOrders > 50) aiTips.push("🛵 تشغيل سائقين إضافيين قبل الذروة");
    if (expectedRevenue > 1000000) aiTips.push("🎁 تشغيل عرض ذكي للحفاظ على الزخم");
    if (activeOrders.length > 8) aiTips.push("👨‍🍳 تقليل وقت التحضير بتجهيز الطلبات المتكررة");
    if (rejectionRate > 8) aiTips.push("📞 مراجعة الطلبات المرفوضة وأسبابها");
    if (expectedOrders < 20) aiTips.push("📣 إطلاق تنبيه تسويقي خفيف داخل التطبيق");

    const hourlyChart = Array.from({ length: 8 }).map((_, index) => {
      const hour = 12 + index;
      const value = hourlyMap[hour] || Math.max(1, Math.round(expectedOrders / 12));
      return {
        label: `${hour}`,
        value,
        percent: Math.min(Math.round((value / Math.max(expectedOrders, 1)) * 160), 100),
      };
    });

    return {
      expectedOrders,
      expectedRevenue,
      avgOrderValue,
      nextPeak,
      demandLevel,
      staffingNeed,
      completionRate,
      rejectionRate,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      alerts,
      aiTips,
      hourlyChart,
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
          FORECAST CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          📈 مركز التوقعات
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          توقع ضغط الطلبات، الإيرادات، وقت الذروة، واحتياج السائقين بواسطة FUSE AI.
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
        <Card
          title="الطلبات المتوقعة"
          value={forecast.expectedOrders}
          color="#ffb347"
          icon="📦"
          note={`الطلب ${forecast.demandLevel}`}
        />

        <Card
          title="الإيرادات المتوقعة"
          value={formatMoney(forecast.expectedRevenue)}
          color="#86efac"
          icon="💰"
          note="حسب متوسط الطلب"
        />

        <Card
          title="متوسط الطلب"
          value={formatMoney(Math.round(forecast.avgOrderValue))}
          color="#93c5fd"
          icon="🧾"
          note={`${forecast.deliveredOrders} طلب مسلّم`}
        />

        <Card
          title="وقت الذروة القادم"
          value={forecast.nextPeak}
          color="#facc15"
          icon="⏱️"
          note={forecast.staffingNeed}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.15fr .85fr",
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
            📊 توقع ضغط الساعات
          </h3>

          <p style={{ margin: "7px 0 0", color: "#71717a", fontSize: 11, fontWeight: 800 }}>
            قراءة تقريبية حسب الطلبات المسلّمة والنشاط الحالي.
          </p>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: `repeat(${forecast.hourlyChart.length}, 1fr)`,
              gap: 10,
              alignItems: "end",
              height: 180,
            }}
          >
            {forecast.hourlyChart.map((item) => (
              <div
                key={item.label}
                style={{
                  display: "grid",
                  alignItems: "end",
                  gap: 8,
                  height: "100%",
                }}
              >
                <div
                  style={{
                    height: `${Math.max(item.percent, 8)}%`,
                    borderRadius: 999,
                    background:
                      "linear-gradient(180deg, #ffb347 0%, #ff7a00 100%)",
                    boxShadow: "0 10px 24px rgba(255,122,0,.18)",
                  }}
                  title={`${item.value} طلب`}
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

        <div
          style={{
            border: "1px solid rgba(255,122,0,.20)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🧠 ملخص القرار
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <Decision
              title="حجم الطلب"
              value={forecast.demandLevel}
              note={`${forecast.expectedOrders} طلب متوقع`}
            />
            <Decision
              title="احتياج التشغيل"
              value={forecast.staffingNeed}
              note="حسب الضغط المتوقع"
            />
            <Decision
              title="نسبة الإنجاز"
              value={`${forecast.completionRate}%`}
              note="طلبات مسلّمة من الإجمالي"
            />
            <Decision
              title="نسبة الرفض"
              value={`${forecast.rejectionRate}%`}
              note="مؤشر جودة التشغيل"
            />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <Panel title="⚠️ التنبيهات المتوقعة" items={forecast.alerts} />
        <Panel title="🧠 توصيات FUSE AI" items={forecast.aiTips} />
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  color,
  icon,
  note,
}: {
  title: string;
  value: string | number;
  color: string;
  icon: string;
  note: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 18,
        padding: 16,
        minHeight: 116,
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
          color,
          fontSize: 22,
          fontWeight: 950,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>

      <p style={{ margin: "7px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
        {note}
      </p>
    </div>
  );
}

function Decision({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.24)",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
        {title}
      </p>

      <p style={{ margin: "6px 0 0", color: "#ffb347", fontSize: 15, fontWeight: 950 }}>
        {value}
      </p>

      <p style={{ margin: "5px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
        {note}
      </p>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 16,
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "white",
          fontWeight: 950,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 10,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              color: "#71717a",
              fontWeight: 850,
            }}
          >
            لا توجد بيانات حالياً
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,.03)",
                borderRadius: 14,
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
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