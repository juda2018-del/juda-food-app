 export default function FuseAI() {
  const insights = [
    {
      title: "أكثر وجبة مبيعاً",
      value: "كاهي قشطة",
      icon: "🍽️",
      note: "حسب طلبات اليوم",
    },
    {
      title: "أفضل سائق",
      value: "علي ⭐ 4.9",
      icon: "🛵",
      note: "أعلى تقييم",
    },
    {
      title: "وقت الذروة",
      value: "8:00 - 11:00",
      icon: "⏰",
      note: "أكثر فترة طلبات",
    },
    {
      title: "أكثر منطقة طلباً",
      value: "زيونة",
      icon: "📍",
      note: "حسب العناوين",
    },
  ];

  const alerts = [
    { text: "ارتفاع الطلبات بنسبة 18٪ عن أمس", type: "good" },
    { text: "عدد السائقين المتاحين منخفض", type: "warn" },
    { text: "بورك الجبن يحقق أعلى مبيعات", type: "good" },
    { text: "وقت الذروة بدأ الآن", type: "warn" },
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
        boxShadow: "0 18px 50px rgba(0,0,0,.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
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
            FUSE AI
          </p>

          <h2
            style={{
              margin: "8px 0 0",
              color: "white",
              fontSize: 26,
              fontWeight: 950,
            }}
          >
            🧠 مركز الذكاء الاصطناعي
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              color: "#a1a1aa",
              fontWeight: 800,
            }}
          >
            تحليلات ذكية للمطعم والأداء والمبيعات
          </p>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,122,0,.30)",
            background: "rgba(255,122,0,.10)",
            color: "#ffb347",
            borderRadius: 999,
            padding: "10px 16px",
            fontWeight: 950,
            whiteSpace: "nowrap",
          }}
        >
          AI ACTIVE
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        {insights.map((item) => (
          <div
            key={item.title}
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
              {item.icon} {item.title}
            </p>

            <p
              style={{
                margin: "12px 0 0",
                color: "#ffb347",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              {item.value}
            </p>

            <p
              style={{
                margin: "8px 0 0",
                color: "#71717a",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {item.note}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,122,0,.20)",
          background: "rgba(255,122,0,.08)",
          borderRadius: 20,
          padding: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "white",
            fontSize: 18,
            fontWeight: 950,
          }}
        >
          🚨 التنبيهات الذكية
        </h3>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 10,
          }}
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              style={{
                borderRadius: 14,
                border:
                  alert.type === "warn"
                    ? "1px solid rgba(255,122,0,.25)"
                    : "1px solid rgba(34,197,94,.25)",
                background:
                  alert.type === "warn"
                    ? "rgba(255,122,0,.10)"
                    : "rgba(34,197,94,.08)",
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
              }}
            >
              {alert.type === "warn" ? "⚠️" : "✅"} {alert.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}