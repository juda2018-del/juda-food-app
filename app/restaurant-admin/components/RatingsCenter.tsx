 export default function RatingsCenter() {
  const reviews = [
    {
      stars: "⭐⭐⭐⭐⭐",
      comment: "الأكل وصل حار وسريع",
    },
    {
      stars: "⭐⭐⭐⭐",
      comment: "التوصيل ممتاز جداً",
    },
    {
      stars: "⭐⭐⭐⭐⭐",
      comment: "أفضل فطور بالعراق",
    },
  ];

  const drivers = [
    { name: "علي", rating: 4.9 },
    { name: "محمد", rating: 4.8 },
    { name: "حسين", rating: 4.7 },
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: "white",
              fontSize: 24,
              fontWeight: 950,
            }}
          >
            ⭐ مركز التقييمات
          </h2>

          <p
            style={{
              marginTop: 6,
              color: "#a1a1aa",
              fontWeight: 800,
            }}
          >
            تقييم المطعم والسائقين
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 220px 1fr",
          gap: 14,
        }}
      >
        <Card title="متوسط التقييم" value="4.8 ⭐" />
        <Card title="عدد التقييمات" value="126" />

        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.20)",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "white",
              fontSize: 16,
              fontWeight: 950,
            }}
          >
            آخر التعليقات
          </h3>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 10,
            }}
          >
            {reviews.map((review, index) => (
              <div key={index}>
                <p
                  style={{
                    margin: 0,
                    color: "#ffb347",
                    fontWeight: 900,
                  }}
                >
                  {review.stars}
                </p>

                <p
                  style={{
                    marginTop: 5,
                    color: "#d4d4d8",
                    fontWeight: 800,
                  }}
                >
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
        }}
      >
        {drivers.map((driver) => (
          <div
            key={driver.name}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              background: "rgba(0,0,0,.20)",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                color: "white",
                fontSize: 16,
                fontWeight: 950,
              }}
            >
              🛵 {driver.name}
            </p>

            <p
              style={{
                marginTop: 8,
                color: "#ffb347",
                fontWeight: 950,
                fontSize: 20,
              }}
            >
              ⭐ {driver.rating}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.20)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#a1a1aa",
          fontWeight: 800,
        }}
      >
        {title}
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#ffb347",
          fontSize: 28,
          fontWeight: 950,
        }}
      >
        {value}
      </p>
    </div>
  );
}