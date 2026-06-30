type OrderDoc = {
  id: string;
  [key: string]: any;
};

const VERSION = "FUSE_RESTAURANT_ORDERS_V18_SERVER_SAFE";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

function decodeValue(value: any): any {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;

  if ("arrayValue" in value) {
    return (value.arrayValue?.values || []).map(decodeValue);
  }

  if ("mapValue" in value) {
    const fields = value.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const key of Object.keys(fields)) out[key] = decodeValue(fields[key]);
    return out;
  }

  return value;
}

function decodeDoc(doc: any): OrderDoc {
  const id = String(doc?.name || "").split("/").pop() || "unknown";
  const fields = doc?.fields || {};
  const out: OrderDoc = { id };

  for (const key of Object.keys(fields)) out[key] = decodeValue(fields[key]);
  return out;
}

function pick(order: OrderDoc, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = order[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function total(order: OrderDoc) {
  for (const key of ["total", "totalPrice", "grandTotal", "amount", "subtotal", "finalTotal"]) {
    const value = order[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

function money(value: number | null) {
  if (value === null) return "غير محدد";
  return new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(value) + " د.ع";
}

function timeMs(order: OrderDoc) {
  const value = order.createdAt || order.created_at || order.created || order.date || order.updatedAt;
  if (!value) return 0;
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  if (typeof value === "string") {
    const t = Date.parse(value);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

function formatTime(order: OrderDoc) {
  const ms = timeMs(order);
  if (!ms) return "بدون وقت";
  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ms));
  } catch {
    return "وقت غير معروف";
  }
}

async function loadOrders() {
  try {
    if (!projectId || !apiKey) {
      return {
        orders: [] as OrderDoc[],
        error: "Firebase ENV ناقصة: NEXT_PUBLIC_FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_API_KEY",
      };
    }

    const url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/(default)/documents/orders?pageSize=50&key=" +
      encodeURIComponent(apiKey);

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        orders: [] as OrderDoc[],
        error: data?.error?.message || data?.error?.status || "Firestore REST read failed",
      };
    }

    const docs = Array.isArray(data?.documents) ? data.documents : [];
    const orders = docs.map(decodeDoc).sort((a: OrderDoc, b: OrderDoc) => timeMs(b) - timeMs(a));

    return { orders, error: "" };
  } catch (err) {
    return {
      orders: [] as OrderDoc[],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function RestaurantOrdersV5Page() {
  const { orders, error } = await loadOrders();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = orders.filter((order) => timeMs(order) >= today.getTime()).length;

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 28, fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ border: "1px solid rgba(34,197,94,.45)", background: "rgba(34,197,94,.12)", color: "#bbf7d0", borderRadius: 22, padding: 16, fontWeight: 900, marginBottom: 22 }}>
          {VERSION}
        </div>

        <header style={{ background: "#111116", border: "1px solid rgba(255,122,0,.35)", borderRadius: 30, padding: 26, marginBottom: 20 }}>
          <p style={{ color: "#ff7a00", margin: 0, fontWeight: 900 }}>FUSE /restaurant-orders-v5</p>
          <h1 style={{ fontSize: 52, lineHeight: 1.1, margin: "12px 0" }}>الطلبات الحقيقية من Firestore</h1>
          <p style={{ color: "#aaa", margin: 0 }}>نسخة آمنة Server Safe، ما تكسر المتصفح.</p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <a href="/customer" style={{ background: "#ff7a00", color: "#000", padding: "14px 22px", borderRadius: 18, fontWeight: 900, textDecoration: "none" }}>فتح الزبون</a>
            <a href="/restaurant-admin" style={{ background: "rgba(255,255,255,.06)", color: "#fff", padding: "14px 22px", borderRadius: 18, fontWeight: 900, textDecoration: "none", border: "1px solid rgba(255,255,255,.14)" }}>لوحة المطعم</a>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 20 }}>
            <p style={{ color: "#888", margin: 0 }}>كل الطلبات</p>
            <b style={{ fontSize: 42 }}>{orders.length}</b>
          </div>
          <div style={{ background: "#111116", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 20 }}>
            <p style={{ color: "#888", margin: 0 }}>طلبات اليوم</p>
            <b style={{ fontSize: 42, color: "#ff7a00" }}>{todayCount}</b>
          </div>
        </div>

        {error ? (
          <div style={{ border: "1px solid rgba(239,68,68,.45)", background: "rgba(239,68,68,.12)", color: "#fecaca", borderRadius: 24, padding: 22, marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>خطأ بقراءة Firestore</h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{error}</p>
            <p style={{ color: "#fca5a5" }}>إذا مكتوب PERMISSION_DENIED، معناها وصلنا Firestore والقواعد مانعة القراءة.</p>
          </div>
        ) : null}

        {orders.length === 0 && !error ? (
          <div style={{ background: "#111116", border: "1px dashed rgba(255,122,0,.45)", borderRadius: 24, padding: 45, textAlign: "center" }}>
            <h2>ماكو طلبات بعد</h2>
            <p style={{ color: "#aaa" }}>أرسل طلب من /customer وارجع هنا.</p>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 16 }}>
          {orders.map((order) => (
            <article key={order.id} style={{ background: "#111116", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, padding: 20 }}>
              <p style={{ color: "#ff7a00", margin: 0 }}>طلب #{order.id.slice(0, 8)}</p>
              <h2 style={{ margin: "8px 0" }}>{pick(order, ["restaurantName", "restaurant", "storeName", "branchName"], "مطعم غير محدد")}</h2>
              <p style={{ color: "#aaa" }}>{formatTime(order)}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
                <div><small style={{ color: "#888" }}>الزبون</small><p>{pick(order, ["customerName", "name", "clientName", "userName"], "غير محدد")}</p></div>
                <div><small style={{ color: "#888" }}>الهاتف</small><p>{pick(order, ["customerPhone", "phone", "mobile", "clientPhone"], "غير محدد")}</p></div>
                <div><small style={{ color: "#888" }}>العنوان</small><p>{pick(order, ["address", "customerAddress", "deliveryAddress", "locationText"], "غير محدد")}</p></div>
                <div><small style={{ color: "#888" }}>الإجمالي</small><p style={{ color: "#ff7a00", fontWeight: 900 }}>{money(total(order))}</p></div>
              </div>

              <details style={{ marginTop: 14 }}>
                <summary style={{ cursor: "pointer", color: "#ddd", fontWeight: 800 }}>البيانات الخام</summary>
                <pre dir="ltr" style={{ maxHeight: 280, overflow: "auto", color: "#aaa", whiteSpace: "pre-wrap", textAlign: "left", fontSize: 12 }}>
                  {JSON.stringify(order, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
