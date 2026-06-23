 type Props = {
  totalOrders: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveringOrders: number;
  todaySales: number;
};

export default function StatsCards({
  totalOrders,
  newOrders,
  preparingOrders,
  readyOrders,
  deliveringOrders,
  todaySales,
}: Props) {
  const deliveredOrders = Math.max(
    totalOrders - newOrders - preparingOrders - readyOrders - deliveringOrders,
    0
  );

  const activeOrders =
    newOrders + preparingOrders + readyOrders + deliveringOrders;

  const completionRate =
    totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  const averageOrder =
    deliveredOrders > 0 ? Math.round(todaySales / deliveredOrders) : 0;

  const pressureLevel =
    newOrders >= 10 || activeOrders >= 18
      ? "ضغط عالي"
      : newOrders >= 5 || activeOrders >= 10
      ? "نشط"
      : "مستقر";

  const kitchenStatus =
    preparingOrders >= 8
      ? "المطبخ مزدحم"
      : preparingOrders >= 3
      ? "تشغيل جيد"
      : "خفيف";

  const aiHealth =
    completionRate >= 80 && activeOrders <= 8
      ? 92
      : completionRate >= 60
      ? 76
      : totalOrders > 0
      ? 58
      : 70;

  const todayGoalPercent = Math.min(Math.round((todaySales / 500000) * 100), 100);

  const cards = [
    {
      title: "كل الطلبات",
      value: totalOrders,
      icon: "📦",
      note: "إجمالي الطلبات",
      hot: false,
      trend: totalOrders > 0 ? "+ اليوم" : "لا توجد",
      tone: "normal",
    },
    {
      title: "طلبات جديدة",
      value: newOrders,
      icon: "🔥",
      note: "بانتظار القبول",
      hot: newOrders > 0,
      trend: newOrders > 8 ? "تحتاج انتباه" : "تحت السيطرة",
      tone: newOrders > 8 ? "danger" : "hot",
    },
    {
      title: "قيد التحضير",
      value: preparingOrders,
      icon: "👨‍🍳",
      note: kitchenStatus,
      hot: preparingOrders > 0,
      trend: preparingOrders >= 8 ? "ضغط مطبخ" : "طبيعي",
      tone: preparingOrders >= 8 ? "warning" : "normal",
    },
    {
      title: "جاهزة",
      value: readyOrders,
      icon: "✅",
      note: "بانتظار السائق",
      hot: readyOrders > 0,
      trend: readyOrders > 5 ? "اسند للسائقين" : "جاهز",
      tone: "success",
    },
    {
      title: "قيد التوصيل",
      value: deliveringOrders,
      icon: "🛵",
      note: "بالطريق للزبائن",
      hot: false,
      trend: deliveringOrders > 0 ? "متابعة مباشرة" : "لا يوجد",
      tone: "normal",
    },
    {
      title: "إيرادات اليوم",
      value: `${todaySales.toLocaleString()} د.ع`,
      icon: "💰",
      note: `متوسط الطلب ${averageOrder.toLocaleString()} د.ع`,
      hot: todaySales > 0,
      trend: deliveredOrders > 0 ? `${deliveredOrders} طلب مسلّم` : "بانتظار التسليم",
      tone: "money",
    },
  ];

  return (
    <section
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {cards.map((card) => (
        <Card key={card.title} {...card} />
      ))}

      <div
        style={{
          gridColumn: "1 / -1",
          border: "1px solid rgba(255,255,255,.09)",
          background:
            "linear-gradient(135deg, rgba(17,16,14,.96), rgba(8,7,6,.96))",
          borderRadius: 22,
          padding: 14,
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
          gap: 12,
          alignItems: "center",
          boxShadow: "0 14px 34px rgba(0,0,0,.22)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#ffb347",
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            ملخص تشغيل FUSE Vendor
          </p>

          <h3
            style={{
              margin: "7px 0 0",
              color: "white",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            حالة المطعم الآن: {pressureLevel}
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: "#71717a",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            متابعة الطلبات، المطبخ، السائقين، والإيرادات من نفس اللوحة.
          </p>
        </div>

        <MiniBar
          title="نسبة الإنجاز"
          value={`${completionRate}%`}
          percent={completionRate}
          note="الطلبات المسلّمة"
        />

        <MiniBar
          title="ضغط الطلبات"
          value={pressureLevel}
          percent={Math.min(Math.round((activeOrders / 20) * 100), 100)}
          note={`${activeOrders} طلب نشط`}
        />

        <MiniBar
          title="جاهزية التوصيل"
          value={readyOrders > 0 ? "تحتاج متابعة" : "مستقرة"}
          percent={Math.min(Math.round((readyOrders / 10) * 100), 100)}
          note={`${readyOrders} طلب جاهز`}
        />
      </div>

      <div
        id="ai-health"
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
        }}
      >
        <MiniBar
          title="AI Health Score"
          value={`${aiHealth}%`}
          percent={aiHealth}
          note="صحة تشغيل المطعم"
        />

        <div id="today-goals">
          <MiniBar
            title="أهداف اليوم"
            value={`${todayGoalPercent}%`}
            percent={todayGoalPercent}
            note="هدف الإيراد 500,000 د.ع"
          />
        </div>

        <div id="smart-alerts">
          <MiniBar
            title="التنبيهات الذكية"
            value={newOrders > 5 || readyOrders > 3 ? "تحتاج متابعة" : "مستقرة"}
            percent={newOrders > 5 || readyOrders > 3 ? 78 : 35}
            note={
              newOrders > 5
                ? "طلبات جديدة كثيرة"
                : readyOrders > 3
                ? "طلبات تنتظر سائق"
                : "لا توجد مخاطر عالية"
            }
          />
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  icon,
  note,
  hot,
  trend,
  tone,
}: {
  title: string;
  value: string | number;
  icon: string;
  note: string;
  hot?: boolean;
  trend: string;
  tone: string;
}) {
  const accent =
    tone === "danger"
      ? "#ef4444"
      : tone === "warning"
      ? "#f59e0b"
      : tone === "success"
      ? "#22c55e"
      : tone === "money"
      ? "#ffb347"
      : "#ff7a00";

  return (
    <div
      style={{
        minHeight: 122,
        border: hot
          ? `1px solid ${accent}55`
          : "1px solid rgba(255,255,255,.09)",
        background: hot
          ? `linear-gradient(135deg, ${accent}1f, rgba(17,16,14,.96))`
          : "linear-gradient(135deg, rgba(17,16,14,.96), rgba(8,7,6,.96))",
        borderRadius: 22,
        padding: 13,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: hot
          ? `0 14px 34px ${accent}18`
          : "0 14px 34px rgba(0,0,0,.20)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: `${accent}16`,
          filter: "blur(24px)",
          left: -30,
          top: -30,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
            {title}
          </p>

          <p
            style={{
              margin: "8px 0 0",
              color: hot ? accent : "white",
              fontSize: 24,
              fontWeight: 950,
              lineHeight: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value}
          </p>
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            minWidth: 42,
            borderRadius: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: hot ? accent : "rgba(0,0,0,.42)",
            color: hot ? "#111" : "#fff",
            fontSize: 21,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ margin: "10px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
          {note}
        </p>

        <div
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            border: `1px solid ${accent}30`,
            background: `${accent}12`,
            color: accent,
            padding: "4px 8px",
            fontSize: 10,
            fontWeight: 950,
          }}
        >
          {trend}
        </div>
      </div>
    </div>
  );
}

function MiniBar({
  title,
  value,
  percent,
  note,
}: {
  title: string;
  value: string;
  percent: number;
  note: string;
}) {
  return (
    <div
      style={{
        height: "100%",
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.25)",
        borderRadius: 18,
        padding: 12,
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
        {title}
      </p>

      <p style={{ margin: "7px 0 0", color: "white", fontSize: 18, fontWeight: 950 }}>
        {value}
      </p>

      <div
        style={{
          marginTop: 9,
          width: "100%",
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, #ff7a00, #ffb347)",
          }}
        />
      </div>

      <p style={{ margin: "7px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
        {note}
      </p>
    </div>
  );
}