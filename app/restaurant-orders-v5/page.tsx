export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderDoc = {
  id: string;
  [key: string]: any;
};

const VERSION = "FUSE_RESTAURANT_ORDERS_V20_FORCE_DYNAMIC";

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
    const values = value.arrayValue?.values || [];
    return values.map((item: any) => decodeValue(item));
  }

  if ("mapValue" in value) {
    const fields = value.mapValue?.fields || {};
    const output: Record<string, any> = {};

    for (const key of Object.keys(fields)) {
      output[key] = decodeValue(fields[key]);
    }

    return output;
  }

  return value;
}

function decodeDoc(doc: any): OrderDoc {
  const id = String(doc?.name || "").split("/").pop() || "unknown";
  const fields = doc?.fields || {};
  const output: OrderDoc = { id };

  for (const key of Object.keys(fields)) {
    output[key] = decodeValue(fields[key]);
  }

  return output;
}

function pickText(order: OrderDoc, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = order[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function pickTotal(order: OrderDoc): number | null {
  const keys = ["total", "totalPrice", "grandTotal", "amount", "subtotal", "finalTotal"];

  for (const key of keys) {
    const value = order[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.]/g, ""));

      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return null;
}

function money(value: number | null): string {
  if (value === null) return "غير محدد";

  return (
    new Intl.NumberFormat("ar-IQ", {
      maximumFractionDigits: 0,
    }).format(value) + " د.ع"
  );
}

function orderTime(order: OrderDoc): number {
  const value =
    order.createdAt ||
    order.created_at ||
    order.created ||
    order.date ||
    order.updatedAt;

  if (!value) return 0;

  if (typeof value === "number") {
    return value < 100000000000 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  return 0;
}

function formatOrderTime(order: OrderDoc): string {
  const millis = orderTime(order);

  if (!millis) return "بدون وقت";

  try {
    return new Intl.DateTimeFormat("ar-IQ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(millis));
  } catch {
    return "وقت غير معروف";
  }
}

function orderStatus(order: OrderDoc): string {
  return pickText(order, ["status", "orderStatus", "state"], "جديد");
}

function getItems(order: OrderDoc): any[] {
  const raw =
    order.items ||
    order.cart ||
    order.orderItems ||
    order.products ||
    order.meals ||
    [];

  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return Object.values(raw);

  return [];
}

function itemName(item: any): string {
  if (typeof item === "string") return item;

  return (
    item?.name ||
    item?.title ||
    item?.itemName ||
    item?.mealName ||
    item?.productName ||
    "مادة بدون اسم"
  );
}

function itemQty(item: any): number {
  const qty = Number(item?.qty ?? item?.quantity ?? item?.count ?? 1);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function itemPrice(item: any): number | null {
  const price = Number(
    item?.price ??
      item?.unitPrice ??
      item?.itemPrice ??
      item?.totalPrice ??
      item?.total ??
      0
  );

  return Number.isFinite(price) && price > 0 ? price : null;
}

async function loadOrders(): Promise<{ orders: OrderDoc[]; error: string }> {
  try {
    if (!projectId || !apiKey) {
      return {
        orders: [],
        error:
          "Firebase ENV ناقصة: NEXT_PUBLIC_FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_API_KEY",
      };
    }

    const url =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/(default)/documents/orders?pageSize=50&key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, { cache: "no-store" });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        orders: [],
        error:
          data?.error?.message ||
          data?.error?.status ||
          "Firestore REST read failed",
      };
    }

    const docs = Array.isArray(data?.documents) ? data.documents : [];

    const orders = docs
      .map((doc: any) => decodeDoc(doc))
      .sort((a: OrderDoc, b: OrderDoc) => orderTime(b) - orderTime(a));

    return { orders, error: "" };
  } catch (error) {
    return {
      orders: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default async function RestaurantOrdersV5Page() {
  const { orders, error } = await loadOrders();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((order: OrderDoc) => {
    return orderTime(order) >= today.getTime();
  });

  const newOrders = orders.filter((order: OrderDoc) => {
    const status = orderStatus(order).toLowerCase();

    return (
      status === "جديد" ||
      status.includes("new") ||
      status.includes("pending")
    );
  });

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: 28,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid rgba(34,197,94,0.45)",
            background: "rgba(34,197,94,0.12)",
            color: "#bbf7d0",
            borderRadius: 22,
            padding: 16,
            fontWeight: 900,
            marginBottom: 22,
          }}
        >
          النسخة الحالية: {VERSION}
        </div>

        <header
          style={{
            background: "#111116",
            border: "1px solid rgba(255,122,0,0.35)",
            borderRadius: 30,
            padding: 26,
            marginBottom: 22,
          }}
        >
          <p style={{ color: "#ff7a00", margin: 0, fontWeight: 900 }}>
            FUSE /restaurant-orders-v5
          </p>

          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.1,
              margin: "12px 0",
              fontWeight: 950,
            }}
          >
            الطلبات الحقيقية من Firestore
          </h1>

          <p style={{ color: "#aaa", margin: 0, lineHeight: 1.8 }}>
            نسخة Server Safe بدون JavaScript على المتصفح، حتى ما تطلع رسالة
            This page couldn&apos;t load.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <a
              href="/customer"
              style={{
                background: "#ff7a00",
                color: "#000",
                padding: "14px 22px",
                borderRadius: 18,
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              فتح الزبون
            </a>

            <a
              href="/restaurant-admin"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: 18,
                fontWeight: 900,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              رجوع للوحة المطعم
            </a>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <p style={{ color: "#888", margin: 0 }}>كل الطلبات</p>
            <b style={{ fontSize: 42 }}>{orders.length}</b>
          </div>

          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <p style={{ color: "#888", margin: 0 }}>طلبات اليوم</p>
            <b style={{ fontSize: 42, color: "#ff7a00" }}>{todayOrders.length}</b>
          </div>

          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 24,
              padding: 20,
            }}
          >
            <p style={{ color: "#888", margin: 0 }}>طلبات جديدة</p>
            <b style={{ fontSize: 42 }}>{newOrders.length}</b>
          </div>
        </section>

        {error ? (
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.12)",
              color: "#fecaca",
              borderRadius: 24,
              padding: 22,
              marginBottom: 22,
            }}
          >
            <h2 style={{ marginTop: 0 }}>خطأ بقراءة Firestore</h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{error}</p>
            <p style={{ color: "#fca5a5", marginBottom: 0 }}>
              إذا مكتوب PERMISSION_DENIED، فهذا يعني الصفحة وصلت Firestore
              والقواعد تمنع قراءة orders.
            </p>
          </div>
        ) : null}

        {orders.length === 0 && !error ? (
          <div
            style={{
              background: "#111116",
              border: "1px dashed rgba(255,122,0,0.45)",
              borderRadius: 24,
              padding: 45,
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>ماكو طلبات بعد</h2>
            <p style={{ color: "#aaa" }}>
              أرسل طلب جديد من /customer وارجع هنا.
            </p>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 16 }}>
          {orders.map((order: OrderDoc) => {
            const orderItems = getItems(order);
            const total = pickTotal(order);

            return (
              <article
                key={order.id}
                style={{
                  background: "#111116",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 24,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 18,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          background: "#ff7a00",
                          color: "#000",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {orderStatus(order)}
                      </span>

                      <span
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "#ddd",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                        }}
                      >
                        {formatOrderTime(order)}
                      </span>
                    </div>

                    <p style={{ color: "#ff7a00", margin: 0 }}>
                      طلب #{order.id.slice(0, 8)}
                    </p>

                    <h2 style={{ fontSize: 26, margin: "8px 0 0" }}>
                      {pickText(
                        order,
                        ["restaurantName", "restaurant", "storeName", "branchName"],
                        "مطعم غير محدد"
                      )}
                    </h2>
                  </div>

                  <div
                    style={{
                      background: "rgba(0,0,0,0.30)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 18,
                      padding: "14px 18px",
                      minWidth: 150,
                    }}
                  >
                    <p style={{ color: "#888", margin: 0, fontSize: 12 }}>
                      الإجمالي
                    </p>
                    <p
                      style={{
                        color: "#ff7a00",
                        margin: "6px 0 0",
                        fontSize: 24,
                        fontWeight: 900,
                      }}
                    >
                      {money(total)}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <p style={{ color: "#777", margin: 0, fontSize: 12 }}>
                      الزبون
                    </p>
                    <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                      {pickText(
                        order,
                        ["customerName", "name", "clientName", "userName"],
                        "زبون غير محدد"
                      )}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <p style={{ color: "#777", margin: 0, fontSize: 12 }}>
                      الهاتف
                    </p>
                    <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                      {pickText(
                        order,
                        ["customerPhone", "phone", "mobile", "clientPhone"],
                        "غير محدد"
                      )}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <p style={{ color: "#777", margin: 0, fontSize: 12 }}>
                      العنوان
                    </p>
                    <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                      {pickText(
                        order,
                        ["address", "customerAddress", "deliveryAddress", "locationText"],
                        "غير محدد"
                      )}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 18,
                    overflow: "hidden",
                    marginTop: 18,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 130px",
                      background: "rgba(255,255,255,0.06)",
                      padding: 12,
                      color: "#aaa",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    <span>المادة</span>
                    <span style={{ textAlign: "center" }}>الكمية</span>
                    <span style={{ textAlign: "left" }}>السعر</span>
                  </div>

                  {orderItems.length > 0 ? (
                    orderItems.map((item: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 130px",
                          padding: 12,
                          borderTop: "1px solid rgba(255,255,255,0.10)",
                          fontSize: 14,
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>{itemName(item)}</span>
                        <span style={{ textAlign: "center", color: "#ddd" }}>
                          {itemQty(item)}
                        </span>
                        <span style={{ textAlign: "left", color: "#ddd" }}>
                          {money(itemPrice(item))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 14,
                        borderTop: "1px solid rgba(255,255,255,0.10)",
                        color: "#aaa",
                      }}
                    >
                      الطلب موجود، لكن ما لقينا items/cart داخله.
                    </div>
                  )}
                </div>

                <details
                  style={{
                    background: "rgba(0,0,0,0.30)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 18,
                    padding: 14,
                    marginTop: 18,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 800,
                      color: "#ddd",
                    }}
                  >
                    بيانات Firestore الخام
                  </summary>

                  <pre
                    dir="ltr"
                    style={{
                      marginTop: 14,
                      maxHeight: 300,
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      color: "#aaa",
                      fontSize: 12,
                      textAlign: "left",
                    }}
                  >
                    {JSON.stringify(order, null, 2)}
                  </pre>
                </details>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}


