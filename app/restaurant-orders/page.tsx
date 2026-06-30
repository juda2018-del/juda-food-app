export default function RestaurantOrdersStaticProof() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          width: "100%",
          border: "3px solid #22c55e",
          borderRadius: "30px",
          padding: "45px",
          background: "#111116",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            lineHeight: 1.25,
            marginBottom: "20px",
            color: "#ffffff",
          }}
        >
          FUSE_RESTAURANT_ORDERS_V13_STATIC_ROUTE_OK
        </h1>

        <p
          style={{
            fontSize: "22px",
            fontWeight: 900,
            color: "#ff7a00",
            marginBottom: "16px",
          }}
        >
          /restaurant-orders route is clean and loading.
        </p>

        <p style={{ fontSize: "18px", color: "#bbbbbb" }}>
          الخطوة الجاية نركب قراءة الطلبات بطريقة آمنة بعد ما نتأكد أن المسار ما عاد ينكسر.
        </p>
      </div>
    </main>
  );
}
