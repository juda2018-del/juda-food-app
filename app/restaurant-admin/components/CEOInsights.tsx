 export default function CEOInsights() {
  const insights = [
    {
      title: "نمو المبيعات المتوقع",
      value: "+22%",
      icon: "📈",
      color: "#86efac",
    },
    {
      title: "الأرباح المتوقعة",
      value: "7,500,000 د.ع",
      icon: "💰",
      color: "#ffb347",
    },
    {
      title: "أفضل منتج",
      value: "كاهي قشطة",
      icon: "🏆",
      color: "#facc15",
    },
    {
      title: "أفضل سائق",
      value: "علي ⭐ 4.9",
      icon: "🛵",
      color: "#93c5fd",
    },
    {
      title: "مستوى رضا العملاء",
      value: "4.8 / 5",
      icon: "⭐",
      color: "#fb923c",
    },
    {
      title: "المخاطر الحالية",
      value: "انخفاض عدد السائقين",
      icon: "🚨",
      color: "#fca5a5",
    },
  ];

  const recommendations = [
    "زيادة عدد السائقين في ساعات الذروة.",
    "إضافة عرض خاص على بورك الجبن.",
    "زيادة المخزون الخاص بكاهي القشطة.",
    "توسيع التغطية إلى مناطق جديدة.",
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
          CEO INSIGHTS
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          👑 رؤى الإدارة العليا
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          تحليلات وتوصيات استراتيجية مدعومة بـ FUSE AI
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

      <div
        style={{
          marginTop: 22,
          border: "1px solid rgba(255,122,0,.20)",
          background: "rgba(255,122,0,.08)",
          borderRadius: 20,
          padding: 18,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "white",
            fontWeight: 950,
          }}
        >
          🧠 توصيات FUSE AI
        </h3>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gap: 10,
          }}
        >
          {recommendations.map((item, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 14,
                color: "#d4d4d8",
                fontWeight: 850,
              }}
            >
              • {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}