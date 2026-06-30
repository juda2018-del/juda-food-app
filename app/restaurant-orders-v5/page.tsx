export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RestaurantOrdersDeployProof() {
  return (
    <main dir="rtl" style={{
      minHeight: "100vh",
      background: "#050505",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial",
      padding: 30
    }}>
      <div style={{
        maxWidth: 900,
        border: "2px solid #22c55e",
        borderRadius: 30,
        padding: 40,
        background: "#111116",
        textAlign: "center"
      }}>
        <h1 style={{fontSize: 48, marginBottom: 20}}>
          FUSE_RESTAURANT_ORDERS_V5_DEPLOY_PROOF
        </h1>
        <p style={{fontSize: 22, color: "#ff7a00", fontWeight: 900}}>
          إذا تشوف هاي الصفحة، Vercel نشر آخر كود صح.
        </p>
        <p style={{fontSize: 18, color: "#aaa", marginTop: 20}}>
          بعدها نرجع نركب Firestore orders بدون ENV وبدون لمس restaurant-admin.
        </p>
      </div>
    </main>
  );
}
