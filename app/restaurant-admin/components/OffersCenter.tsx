 export default function OffersCenter() {
  const offers = [
    {
      code: "FUSE10",
      discount: "10%",
      expire: "30 / 06 / 2026",
      active: true,
    },
    {
      code: "BREAKFAST20",
      discount: "20%",
      expire: "15 / 07 / 2026",
      active: true,
    },
    {
      code: "VIP30",
      discount: "30%",
      expire: "01 / 08 / 2026",
      active: false,
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
        boxShadow: "0 18px 50px rgba(0,0,0,.25)",
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
          OFFERS CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🎁 العروض والكوبونات
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          إدارة الخصومات والعروض الترويجية
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 14,
        }}
      >
        {offers.map((offer) => (
          <div
            key={offer.code}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.20)",
              borderRadius: 20,
              padding: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: 20,
                  fontWeight: 950,
                }}
              >
                🎟️ {offer.code}
              </h3>

              <p
                style={{
                  marginTop: 8,
                  color: "#ffb347",
                  fontWeight: 950,
                  fontSize: 18,
                }}
              >
                خصم {offer.discount}
              </p>

              <p
                style={{
                  marginTop: 8,
                  color: "#a1a1aa",
                  fontWeight: 800,
                }}
              >
                انتهاء العرض: {offer.expire}
              </p>
            </div>

            <div
              style={{
                background: offer.active
                  ? "rgba(34,197,94,.15)"
                  : "rgba(239,68,68,.15)",
                color: offer.active ? "#86efac" : "#fca5a5",
                border: offer.active
                  ? "1px solid rgba(34,197,94,.30)"
                  : "1px solid rgba(239,68,68,.30)",
                borderRadius: 999,
                padding: "10px 18px",
                fontWeight: 950,
              }}
            >
              {offer.active ? "فعال" : "متوقف"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}