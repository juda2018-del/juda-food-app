"use client";

import { useEffect, useMemo, useState } from "react";

type LiveOrder = {
  id: string;
  [key: string]: any;
};

const PAGE_VERSION = "FUSE_RESTAURANT_ORDERS_V15_LIVE_ON_V5";

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
    return values.map(decodeValue);
  }

  if ("mapValue" in value) {
    const fields = value.mapValue?.fields || {};
    const obj: Record<string, any> = {};

    for (const key of Object.keys(fields)) {
      obj[key] = decodeValue(fields[key]);
    }

    return obj;
  }

  return value;
}

function decodeDoc(doc: any): LiveOrder {
  const id = String(doc?.name || "").split("/").pop() || "unknown";
  const fields = doc?.fields || {};
  const out: LiveOrder = { id };

  for (const key of Object.keys(fields)) {
    out[key] = decodeValue(fields[key]);
  }

  return out;
}

function toMillis(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value?.seconds === "number") return value.seconds * 1000;

  return 0;
}

function orderTime(order: LiveOrder): number {
  return (
    toMillis(order.createdAt) ||
    toMillis(order.created_at) ||
    toMillis(order.created) ||
    toMillis(order.date) ||
    toMillis(order.updatedAt)
  );
}

function formatDate(value: any): string {
  const ms = toMillis(value);
  if (!ms) return "بدون وقت";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function pickText(order: LiveOrder, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = order[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return fallback;
}

function pickNumber(order: LiveOrder, keys: string[]): number | null {
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

function getItems(order: LiveOrder): any[] {
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

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050505",
  color: "white",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: "#111116",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 28,
  padding: 22,
};

const orangeButtonStyle: React.CSSProperties = {
  background: "#ff7a00",
  color: "#000",
  border: 0,
  borderRadius: 18,
  padding: "14px 22px",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
};

const darkButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 18,
  padding: "14px 22px",
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
};

export default function RestaurantOrdersV5LivePage() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      if (!projectId || !apiKey) {
        throw new Error("Firebase ENV ناقصة: NEXT_PUBLIC_FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_API_KEY");
      }

      const url =
        "https://firestore.googleapis.com/v1/projects/" +
        encodeURIComponent(projectId) +
        "/databases/(default)/documents/orders?pageSize=50&key=" +
        encodeURIComponent(apiKey);

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error?.message ||
          data?.error?.status ||
          "Firestore REST read failed";

        throw new Error(message);
      }

      const docs = Array.isArray(data.documents) ? data.documents : [];

      const nextOrders = docs
        .map(decodeDoc)
        .sort((a: LiveOrder, b: LiveOrder) => orderTime(b) - orderTime(a));

      setOrders(nextOrders);
      setLastRefresh(new Date().toLocaleTimeString("ar-IQ"));
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const timer = window.setInterval(() => {
      loadOrders();
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((order) => {
      const t = orderTime(order);
      return t >= today.getTime();
    }).length;

    const newOrders = orders.filter((order) => {
      const status = String(
        pickText(order, ["status", "orderStatus", "state"], "جديد")
      ).toLowerCase();

      return status === "جديد" || status.includes("new") || status.includes("pending");
    }).length;

    return {
      total: orders.length,
      today: todayOrders,
      newOrders,
    };
  }, [orders]);

  return (
    <main dir="rtl" style={pageStyle}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid rgba(34,197,94,0.45)",
            background: "rgba(34,197,94,0.10)",
            color: "#bbf7d0",
            borderRadius: 22,
            padding: 16,
            fontWeight: 900,
            marginBottom: 24,
          }}
        >
          النسخة الحالية: {PAGE_VERSION}
        </div>

        <header
          style={{
            ...cardStyle,
            border: "1px solid rgba(255,122,0,0.35)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 20,
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ color: "#ff7a00", fontWeight: 900, margin: 0 }}>
                FUSE /restaurant-orders-v5
              </p>

              <h1 style={{ fontSize: 54, lineHeight: 1.15, margin: "14px 0 10px" }}>
                الطلبات الحقيقية من Firestore
              </h1>

              <p style={{ color: "#aaa", margin: 0, fontSize: 17 }}>
                صفحة مستقلة تقرأ collection اسمها orders بدون لمس لوحة المطعم.
              </p>

              <p style={{ color: "#777", marginTop: 12, fontSize: 13 }}>
                آخر تحديث: {lastRefresh || "جاري التحميل..."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/customer" style={orangeButtonStyle}>
                فتح الزبون
              </a>

              <a href="/restaurant-admin" style={darkButtonStyle}>
                رجوع للوحة المطعم
              </a>

              <button onClick={loadOrders} style={darkButtonStyle}>
                تحديث الطلبات
              </button>
            </div>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <p style={{ color: "#888", margin: 0 }}>كل الطلبات</p>
            <p style={{ fontSize: 42, fontWeight: 900, margin: "10px 0 0" }}>
              {stats.total}
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#888", margin: 0 }}>طلبات اليوم</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: "#ff7a00", margin: "10px 0 0" }}>
              {stats.today}
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ color: "#888", margin: 0 }}>طلبات جديدة</p>
            <p style={{ fontSize: 42, fontWeight: 900, margin: "10px 0 0" }}>
              {stats.newOrders}
            </p>
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
              marginBottom: 24,
            }}
          >
            <h2 style={{ marginTop: 0 }}>خطأ بقراءة Firestore</h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{error}</p>
            <p style={{ color: "#fca5a5", marginBottom: 0 }}>
              إذا مكتوب PERMISSION_DENIED، نحتاج نعدل Firestore Rules حتى حساب المطعم يقرأ orders.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div style={{ ...cardStyle, textAlign: "center", color: "#aaa", padding: 45 }}>
            جاري تحميل orders...
          </div>
        ) : orders.length === 0 && !error ? (
          <div
            style={{
              ...cardStyle,
              border: "1px dashed rgba(255,122,0,0.45)",
              textAlign: "center",
              padding: 45,
            }}
          >
            <h2 style={{ marginTop: 0 }}>ماكو طلبات بعد</h2>
            <p style={{ color: "#aaa" }}>
              افتح /customer، أرسل طلب جديد، وارجع هنا. الصفحة تحدث نفسها كل 10 ثواني.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {orders.map((order) => {
              const orderItems = getItems(order);
              const total = pickNumber(order, [
                "total",
                "totalPrice",
                "grandTotal",
                "amount",
                "subtotal",
                "finalTotal",
              ]);

              return (
                <article key={order.id} style={cardStyle}>
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
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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
                          {pickText(order, ["status", "orderStatus", "state"], "جديد")}
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
                          {formatDate(
                            order.createdAt ||
                              order.created_at ||
                              order.created ||
                              order.date ||
                              order.updatedAt
                          )}
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
                      <p style={{ color: "#888", margin: 0, fontSize: 12 }}>الإجمالي</p>
                      <p style={{ color: "#ff7a00", margin: "6px 0 0", fontSize: 24, fontWeight: 900 }}>
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
                    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 18, padding: 14 }}>
                      <p style={{ color: "#777", margin: 0, fontSize: 12 }}>الزبون</p>
                      <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                        {pickText(order, ["customerName", "name", "clientName", "userName"], "زبون غير محدد")}
                      </p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 18, padding: 14 }}>
                      <p style={{ color: "#777", margin: 0, fontSize: 12 }}>الهاتف</p>
                      <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                        {pickText(order, ["customerPhone", "phone", "mobile", "clientPhone"], "غير محدد")}
                      </p>
                    </div>

                    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 18, padding: 14 }}>
                      <p style={{ color: "#777", margin: 0, fontSize: 12 }}>العنوان</p>
                      <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                        {pickText(order, ["address", "customerAddress", "deliveryAddress", "locationText"], "غير محدد")}
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
                      orderItems.map((item, index) => (
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
                          <span style={{ textAlign: "center", color: "#ddd" }}>{itemQty(item)}</span>
                          <span style={{ textAlign: "left", color: "#ddd" }}>{money(itemPrice(item))}</span>
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
                    <summary style={{ cursor: "pointer", fontWeight: 800, color: "#ddd" }}>
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
        )}
      </div>
    </main>
  );
}
