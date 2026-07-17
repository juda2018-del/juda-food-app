export default function RestaurantOrdersCleanRoute() {
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
        <h1 style={{ fontSize: "42px", lineHeight: 1.25, marginBottom: "20px" }}>
          FUSE_RESTAURANT_ORDERS_V14_CLEAN_ROUTE_OK
        </h1>

        <p style={{ fontSize: "22px", fontWeight: 900, color: "#ff7a00" }}>
          /restaurant-orders is now cleaned and loading.
        </p>

        <p style={{ fontSize: "18px", color: "#bbbbbb", marginTop: "18px" }}>
          إذا تشوف هاي الصفحة، نقدر نركب قراءة orders بعدها بدون ما تنكسر.
        </p>
      </div>
    </main>
  );
}
