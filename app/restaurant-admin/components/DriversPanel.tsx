 type Props = {
  availableDrivers: any[];
  busyDrivers: number;
};

function formatLastSeen(value?: number) {
  if (!value) return "غير معروف";

  const minutes = Math.floor((Date.now() - value) / 1000 / 60);

  if (minutes <= 0) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;

  return `قبل ${Math.floor(minutes / 60)} ساعة`;
}

function hasLocation(driver: any) {
  return (
    typeof driver?.latitude === "number" &&
    typeof driver?.longitude === "number"
  );
}

export default function DriversPanel({
  availableDrivers,
  busyDrivers,
}: Props) {
  const lastDriver = availableDrivers[0];
  const totalVisible = availableDrivers.length + busyDrivers;
  const readyStatus = availableDrivers.length > 0 ? "جاهز" : "انتظار";
  const fleetHealth =
    availableDrivers.length >= 4
      ? "ممتاز"
      : availableDrivers.length >= 2
      ? "مستقر"
      : "منخفض";

  const leaderboard = availableDrivers.slice(0, 6).map((driver, index) => {
    const score =
      100 -
      index * 8 +
      (hasLocation(driver) ? 6 : 0) +
      (driver.lastSeen ? 4 : 0);

    return {
      ...driver,
      rank: index + 1,
      score: Math.max(score, 50),
    };
  });

  const alerts = [
    availableDrivers.length < 2
      ? "⚠️ عدد السائقين المتاحين منخفض، يفضل تشغيل سائقين إضافيين."
      : `🟢 يوجد ${availableDrivers.length} سائق متاح للتوزيع.`,
    busyDrivers > availableDrivers.length
      ? "🔥 ضغط توصيل عالي مقارنة بعدد السائقين المتاحين."
      : "✅ ضغط التوصيل تحت السيطرة حالياً.",
    lastDriver
      ? `🏆 أفضل مرشح للتوزيع الآن: ${lastDriver.name || lastDriver.id}`
      : "لا يوجد سائق متاح حالياً.",
  ];

  return (
    <section
      style={{
        marginTop: 16,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,.28)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#ffb347",
              fontSize: 11,
              fontWeight: 950,
              letterSpacing: 2,
            }}
          >
            DRIVER CONTROL
          </p>

          <h2
            style={{
              margin: "6px 0 0",
              color: "white",
              fontSize: 24,
              fontWeight: 950,
            }}
          >
            🛵 مركز السائقين
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#a1a1aa",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            متابعة السائقين، جاهزية التوزيع، وترتيب أفضل السائقين لحظة بلحظة.
          </p>
        </div>

        <div
          style={{
            minWidth: 180,
            border: "1px solid rgba(255,122,0,.24)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 18,
            padding: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#a1a1aa",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            صحة الأسطول
          </p>

          <h3
            style={{
              margin: "7px 0 0",
              color:
                fleetHealth === "ممتاز"
                  ? "#86efac"
                  : fleetHealth === "مستقر"
                  ? "#ffb347"
                  : "#fca5a5",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            {fleetHealth}
          </h3>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        <Mini title="متاح" value={availableDrivers.length} icon="🟢" />
        <Mini title="مشغول" value={busyDrivers} icon="🟠" />
        <Mini title="إجمالي ظاهر" value={totalVisible} icon="📊" />
        <Mini
          title="آخر سائق"
          value={lastDriver?.name || "لا يوجد"}
          icon="🛵"
        />
        <Mini title="حالة التوزيع" value={readyStatus} icon="📍" />
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1.15fr .85fr",
          gap: 14,
        }}
      >
        <div
          id="driver-leaderboard"
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.22)",
            borderRadius: 22,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🏆 ترتيب السائقين المتاحين
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {leaderboard.length === 0 ? (
              <Empty text="لا توجد بيانات سائقين متاحين حالياً" />
            ) : (
              leaderboard.map((driver) => (
                <div
                  key={driver.id}
                  style={{
                    border: "1px solid rgba(255,255,255,.08)",
                    background:
                      driver.rank === 1
                        ? "rgba(255,122,0,.11)"
                        : "rgba(255,255,255,.035)",
                    borderRadius: 16,
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      background:
                        driver.rank === 1
                          ? "linear-gradient(135deg,#ff7a00,#ffb347)"
                          : "rgba(255,255,255,.08)",
                      color: driver.rank === 1 ? "#111" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 950,
                    }}
                  >
                    {driver.rank}
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: "white",
                        fontSize: 13,
                        fontWeight: 950,
                      }}
                    >
                      {driver.name || driver.id}
                    </p>

                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#a1a1aa",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {driver.phone || "لا يوجد رقم"} •{" "}
                      {hasLocation(driver) ? "موقع فعال" : "بدون موقع"} •{" "}
                      {formatLastSeen(driver.lastSeen)}
                    </p>
                  </div>

                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        margin: 0,
                        color: "#ffb347",
                        fontSize: 15,
                        fontWeight: 950,
                      }}
                    >
                      {driver.score}
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#71717a",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      نقطة
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,122,0,.22)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 22,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🚨 تنبيهات السائقين
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(0,0,0,.22)",
                  borderRadius: 14,
                  padding: 12,
                  color: "#d4d4d8",
                  fontWeight: 850,
                  lineHeight: 1.7,
                  fontSize: 12,
                }}
              >
                {alert}
              </div>
            ))}
          </div>
        </div>
      </div>

      {availableDrivers.length > 0 && (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {availableDrivers.slice(0, 4).map((driver) => (
            <div
              key={driver.id}
              style={{
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(0,0,0,.24)",
                borderRadius: 18,
                padding: 12,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 950,
                }}
              >
                {driver.name || driver.id}
              </p>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#a1a1aa",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {driver.phone || "لا يوجد رقم"}
              </p>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#22c55e",
                  fontSize: 12,
                  fontWeight: 950,
                }}
              >
                ● متصل
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Mini({
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
        border: "1px solid rgba(255,255,255,.10)",
        background: "#060504",
        borderRadius: 18,
        padding: 13,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#a1a1aa",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {icon} {title}
      </p>

      <p
        style={{
          margin: "6px 0 0",
          color: "#ffb347",
          fontSize: 18,
          fontWeight: 950,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
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
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
        color: "#71717a",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}