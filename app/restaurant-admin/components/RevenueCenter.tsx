 export default function RevenueCenter() {
  const cards = [
    {
      title: "إيرادات اليوم",
      value: "185,000 د.ع",
      icon: "💰",
    },
    {
      title: "إيرادات الأسبوع",
      value: "1,240,000 د.ع",
      icon: "📈",
    },
    {
      title: "إيرادات الشهر",
      value: "5,860,000 د.ع",
      icon: "🏆",
    },
    {
      title: "متوسط الطلب",
      value: "18,500 د.ع",
      icon: "📦",
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
          REVENUE CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          💰 مركز الإيرادات
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          متابعة الأرباح والمبيعات اليومية والأسبوعية والشهرية
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
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#a1a1aa",
                fontWeight: 800,
              }}
            >
              {card.icon} {card.title}
            </p>

            <p
              style={{
                marginTop: 12,
                color: "#ffb347",
                fontSize: 26,
                fontWeight: 950,
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}