 export default function SmartSuggestionsCenter() {
  const suggestions = [
    {
      icon: "🔥",
      title: "وقت الذروة بدأ",
      desc: "يفضل زيادة عدد السائقين خلال الساعتين القادمتين.",
    },
    {
      icon: "🍽️",
      title: "بورك الجبن يحقق مبيعات عالية",
      desc: "ينصح بإضافة عرض خاص لزيادة الأرباح.",
    },
    {
      icon: "⚠️",
      title: "انخفاض الطلبات",
      desc: "عدد الطلبات أقل من متوسط الأسبوع الماضي.",
    },
    {
      icon: "⭐",
      title: "تحسين التقييمات",
      desc: "السرعة في تجهيز الطلبات سترفع تقييم المطعم.",
    },
    {
      icon: "🛵",
      title: "السائقون المتاحون قليلون",
      desc: "يفضل تشغيل سائقين إضافيين.",
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
          SMART SUGGESTIONS
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🤖 الاقتراحات الذكية
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          توصيات FUSE AI لتحسين الأداء والمبيعات
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
        }}
      >
        {suggestions.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 18,
              padding: 18,
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "rgba(255,122,0,.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              {item.icon}
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#ffb347",
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  marginTop: 8,
                  color: "#d4d4d8",
                  fontWeight: 800,
                  lineHeight: 1.7,
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}