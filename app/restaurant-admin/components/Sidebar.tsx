 export default function Sidebar() {
  const items = [
    { label: "نظرة عامة", icon: "🏠", target: "top", active: false },
    { label: "الطلبات", icon: "📦", target: "orders", active: true },
    { label: "قيادة CEO", icon: "👑", target: "ceo-command", active: false },
    { label: "مركز التحكم", icon: "🎛️", target: "command", active: false },
    { label: "Dispatch AI", icon: "🚀", target: "dispatch-ai", active: false },
    { label: "الخريطة الحية", icon: "🗺️", target: "live-map", active: false },
    { label: "التوقعات", icon: "📈", target: "forecast", active: false },
    { label: "التحليلات", icon: "📊", target: "analytics", active: false },
    { label: "الإيرادات", icon: "💰", target: "revenue", active: false },
    { label: "الزبائن", icon: "👥", target: "customers", active: false },
    { label: "المخزون الذكي", icon: "📦", target: "inventory", active: false },
    { label: "النشاط المباشر", icon: "🛰️", target: "live-activity", active: false },
    { label: "ترتيب السائقين", icon: "🏆", target: "driver-leaderboard", active: false },
    { label: "AI Health", icon: "🧠", target: "ai-health", active: false },
    { label: "أهداف اليوم", icon: "🎯", target: "today-goals", active: false },
    { label: "التنبيهات الذكية", icon: "🚨", target: "smart-alerts", active: false },
    { label: "التنبيهات", icon: "🔔", target: "notifications", active: false },
    { label: "السائقين", icon: "🛵", target: "drivers", active: false },
    { label: "أداء الأسطول", icon: "🏍️", target: "fleet", active: false },
    { label: "المنيو", icon: "🍽️", target: "menu", active: false },
    { label: "الأكثر مبيعاً", icon: "🔥", target: "products", active: false },
    { label: "ساعات الذروة", icon: "⏱️", target: "peak-hours", active: false },
    { label: "Heat Map", icon: "🌡️", target: "heat-map", active: false },
    { label: "العروض", icon: "🎁", target: "offers", active: false },
    { label: "التقييمات", icon: "⭐", target: "ratings", active: false },
    { label: "Fuse Copilot", icon: "🤖", target: "copilot", active: false },
    { label: "FUSE AI", icon: "🧠", target: "ai", active: false },
    { label: "الإعدادات", icon: "⚙️", target: "settings", active: false },
  ];

  function goTo(target: string) {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <aside
      style={{
        width: 250,
        maxHeight: "calc(100vh - 36px)",
        minHeight: "calc(100vh - 36px)",
        position: "sticky",
        top: 18,
        overflowY: "auto",
        scrollbarWidth: "thin",
        background:
          "linear-gradient(180deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 26,
        padding: 16,
        boxShadow: "0 22px 60px rgba(0,0,0,.35)",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,122,0,.25)",
          background: "rgba(255,122,0,.08)",
          borderRadius: 22,
          padding: 14,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: "linear-gradient(135deg, #ff7a00, #ffb347)",
            color: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 950,
          }}
        >
          🔥
        </div>

        <h2
          style={{
            margin: "12px 0 0",
            color: "white",
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          FUSE Vendor
        </h2>

        <p
          style={{
            margin: "5px 0 0",
            color: "#a1a1aa",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          لوحة تشغيل المطعم
        </p>
      </div>

      <nav
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => goTo(item.target)}
            style={{
              width: "100%",
              background: item.active
                ? "linear-gradient(135deg, rgba(255,122,0,.20), rgba(255,122,0,.08))"
                : "rgba(255,255,255,.03)",
              border: item.active
                ? "1px solid rgba(255,122,0,.40)"
                : "1px solid rgba(255,255,255,.08)",
              color: item.active ? "#ffb347" : "white",
              borderRadius: 16,
              padding: "13px 14px",
              textAlign: "right",
              fontWeight: 950,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.25)",
          borderRadius: 18,
          padding: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#71717a",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          المطعم
        </p>

        <p
          style={{
            margin: "6px 0 0",
            color: "white",
            fontSize: 15,
            fontWeight: 950,
          }}
        >
          فيروز
        </p>

        <p
          style={{
            margin: "5px 0 0",
            color: "#22c55e",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          ● متصل
        </p>
      </div>

      <button
        style={{
          marginTop: 12,
          width: "100%",
          border: "1px solid rgba(239,68,68,.35)",
          background: "rgba(239,68,68,.10)",
          color: "#fca5a5",
          borderRadius: 16,
          padding: "12px 14px",
          fontWeight: 950,
          cursor: "pointer",
        }}
      >
        تسجيل خروج
      </button>
    </aside>
  );
}