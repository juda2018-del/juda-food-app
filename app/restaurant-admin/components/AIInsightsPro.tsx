 export default function AIInsightsPro() {
  const insights = [
    {
      icon: "📈",
      title: "توقع الطلبات القادمة",
      value: "148 طلب",
      color: "#ffb347",
    },
    {
      icon: "🍽️",
      title: "الوجبة الأكثر طلباً",
      value: "كاهي قشطة",
      color: "#86efac",
    },
    {
      icon: "🛵",
      title: "السائقون المطلوبون",
      value: "6 سائقين",
      color: "#93c5fd",
    },
    {
      icon: "⭐",
      title: "رضا العملاء المتوقع",
      value: "4.9",
      color: "#facc15",
    },
    {
      icon: "🔥",
      title: "وقت الذروة القادم",
      value: "8:00 - 11:00",
      color: "#fb923c",
    },
    {
      icon: "🚨",
      title: "تنبيه المخزون",
      value: "بورك الجبن منخفض",
      color: "#fca5a5",
    },
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
          AI INSIGHTS PRO
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🧠 التحليلات الذكية المتقدمة
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          توقعات وتحليلات FUSE AI للمبيعات والأداء
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
        }}
      >
        {insights.map((item) => (
          <div
            key={item.title}
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
              {item.icon} {item.title}
            </p>

            <h3
              style={{
                marginTop: 14,
                color: item.color,
                fontSize: 24,
                fontWeight: 950,
              }}
            >
              {item.value}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}