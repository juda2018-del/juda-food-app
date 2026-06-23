 type Props = {
  restaurantName: string;
  restaurantStatus: "مفتوح" | "مشغول" | "مغلق";
  setRestaurantStatus: (value: "مفتوح" | "مشغول" | "مغلق") => void;
  activeOrders: number;
  availableDrivers: number;
  todaySales: number;
  search: string;
  setSearch: (value: string) => void;
};

export default function Header({
  restaurantName,
  restaurantStatus,
  setRestaurantStatus,
  activeOrders,
  availableDrivers,
  todaySales,
  search,
  setSearch,
}: Props) {
  const statusColor =
    restaurantStatus === "مفتوح"
      ? "#22c55e"
      : restaurantStatus === "مشغول"
      ? "#f59e0b"
      : "#ef4444";

  const avgPrepTime =
    activeOrders <= 3 ? "12 دقيقة" : activeOrders <= 8 ? "18 دقيقة" : "25 دقيقة";

  const serviceHealth =
    restaurantStatus === "مغلق"
      ? "متوقف"
      : activeOrders > 10
      ? "ضغط عالي"
      : activeOrders > 5
      ? "نشط"
      : "ممتاز";

  const satisfaction =
    restaurantStatus === "مغلق" ? "0%" : activeOrders > 10 ? "82%" : "96%";

  return (
    <header
      style={{
        background:
          "linear-gradient(135deg, rgba(20,17,14,.98), rgba(8,7,6,.98))",
        borderRadius: 28,
        border: "1px solid rgba(255,122,0,.22)",
        padding: 18,
        boxShadow: "0 22px 60px rgba(0,0,0,.38)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(255,122,0,.13)",
          filter: "blur(60px)",
          top: -120,
          left: -80,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 18,
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#ffb347",
                fontWeight: 950,
                letterSpacing: 4,
                fontSize: 11,
              }}
            >
              FUSE VENDOR
            </p>

            <span
              style={{
                border: `1px solid ${statusColor}55`,
                background: `${statusColor}18`,
                color: statusColor,
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 950,
              }}
            >
              ● {restaurantStatus}
            </span>

            <span
              style={{
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.04)",
                color: "#d4d4d8",
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              تشغيل مباشر
            </span>
          </div>

          <h1
            style={{
              color: "white",
              fontSize: 34,
              fontWeight: 950,
              margin: "9px 0 0",
              lineHeight: 1.15,
            }}
          >
            🔥 لوحة مطعم {restaurantName}
          </h1>

          <p
            style={{
              color: "#a1a1aa",
              margin: "7px 0 0",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            إدارة الطلبات المباشرة، السائقين، الأداء، الإيرادات والتشغيل الذكي
            من مكان واحد.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            minWidth: 190,
          }}
        >
          <select
            value={restaurantStatus}
            onChange={(e) =>
              setRestaurantStatus(e.target.value as "مفتوح" | "مشغول" | "مغلق")
            }
            style={{
              width: "100%",
              height: 46,
              borderRadius: 15,
              background: "#060504",
              color: "white",
              border: `1px solid ${statusColor}55`,
              padding: "0 12px",
              fontWeight: 950,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="مفتوح">🟢 مفتوح</option>
            <option value="مشغول">🟠 مشغول</option>
            <option value="مغلق">🔴 مغلق</option>
          </select>

          <div
            style={{
              height: 46,
              borderRadius: 15,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(0,0,0,.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
            }}
          >
            <span style={{ color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
              حالة التشغيل
            </span>
            <strong style={{ color: "#ffb347", fontSize: 13 }}>
              {serviceHealth}
            </strong>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1.4fr repeat(4, minmax(130px, 1fr))",
          gap: 10,
          position: "relative",
          zIndex: 2,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم الزبون أو الرقم أو السائق..."
          style={{
            height: 48,
            borderRadius: 16,
            background: "#060504",
            border: "1px solid rgba(255,255,255,.12)",
            color: "white",
            padding: "0 16px",
            outline: "none",
            fontWeight: 900,
          }}
        />

        <Mini label="طلبات نشطة" value={activeOrders} icon="📦" />
        <Mini label="سائقين متاحين" value={availableDrivers} icon="🛵" />
        <Mini label="مبيعات اليوم" value={`${todaySales.toLocaleString()} د.ع`} icon="💰" />
        <Mini label="وقت التحضير" value={avgPrepTime} icon="⏱️" />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Quick title="رضا الزبائن" value={satisfaction} note="حسب آخر الطلبات" />
        <Quick title="سرعة الاستجابة" value={activeOrders > 8 ? "متوسطة" : "عالية"} note="طلبات قيد المعالجة" />
        <Quick title="توفر السائقين" value={availableDrivers > 0 ? "متاح" : "منخفض"} note={`${availableDrivers} سائق متصل`} />
        <Quick title="نظام FUSE AI" value="فعال" note="اقتراحات وتشغيل ذكي" />
      </div>
    </header>
  );
}

function Mini({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      style={{
        height: 48,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.10)",
        background: "rgba(0,0,0,.30)",
        padding: "7px 11px",
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background: "rgba(255,122,0,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {icon}
      </div>

      <div>
        <p style={{ margin: 0, color: "#71717a", fontSize: 10, fontWeight: 900 }}>
          {label}
        </p>

        <p
          style={{
            margin: "2px 0 0",
            color: "#ffb347",
            fontSize: 14,
            fontWeight: 950,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Quick({
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
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.08)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.018))",
        padding: "11px 12px",
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
        {title}
      </p>

      <p style={{ margin: "6px 0 0", color: "white", fontSize: 16, fontWeight: 950 }}>
        {value}
      </p>

      <p style={{ margin: "4px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
        {note}
      </p>
    </div>
  );
}