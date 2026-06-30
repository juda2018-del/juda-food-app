export default function RestaurantOrdersV5() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#050505",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "900px",
        border: "3px solid #22c55e",
        borderRadius: "32px",
        padding: "48px",
        background: "#111116",
        textAlign: "center"
      }}>
        <h1 style={{ fontSize: "44px", marginBottom: "20px" }}>
          FUSE_RESTAURANT_ORDERS_V5_DEPLOY_PROOF_OK
        </h1>

        <p style={{ fontSize: "22px", color: "#ff7a00", fontWeight: 900 }}>
          Vercel is deploying the latest code correctly.
        </p>

        <p style={{ fontSize: "18px", color: "#aaaaaa", marginTop: "20px" }}>
          Next step: connect Firestore orders safely.
        </p>
      </div>
    </main>
  );
}
