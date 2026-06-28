"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerName?: string;
  customer?: string;
  name?: string;
  phone?: string;
  customerPhone?: string;
  restaurant?: string;
  restaurantName?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  createdAt?: unknown;
};

function cleanPhone(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getPhone(order: OrderDoc) {
  return order.phone || order.customerPhone || "";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurant || order.restaurantName || "مطعم";
}

function isDelivered(order: OrderDoc) {
  return order.status === "تم التسليم" || order.status === "delivered";
}

function matchesSearch(order: OrderDoc, search: string) {
  const value = search.trim().toLowerCase();
  const phoneValue = cleanPhone(search);

  if (!value && !phoneValue) return false;

  const orderPhone = cleanPhone(getPhone(order));
  const orderId = (order.orderId || order.documentId || "").toLowerCase();

  if (phoneValue.length >= 5 && orderPhone) {
    return orderPhone.includes(phoneValue) || phoneValue.includes(orderPhone);
  }

  return orderId.includes(value);
}

function stars(value: number, setter: (value: number) => void) {
  return (
    <div style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setter(star)}
          style={{
            ...styles.starButton,
            color: star <= value ? "#FF7A00" : "rgba(255,255,255,0.25)",
          }}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%), #050505",
    color: "white",
    padding: "26px 16px",
    fontFamily: "Arial, sans-serif",
  },
  shell: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  pill: {
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    padding: "11px 16px",
    color: "rgba(255,255,255,0.82)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  hero: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 34,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.10))",
    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    padding: 22,
    marginBottom: 16,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.45fr)",
    gap: 14,
    alignItems: "stretch",
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(0,0,0,0.36)",
    padding: 20,
  },
  eyebrow: {
    margin: 0,
    color: "#FF7A00",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(38px, 6vw, 66px)",
    lineHeight: 1.08,
    fontWeight: 950,
  },
  orange: {
    color: "#FF7A00",
  },
  muted: {
    color: "rgba(255,255,255,0.58)",
    lineHeight: 1.85,
    fontSize: 14,
  },
  searchBox: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 28,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "15px 16px",
    outline: "none",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    background: "#070707",
    color: "white",
    padding: "15px 16px",
    outline: "none",
    fontSize: 15,
    resize: "vertical",
  },
  resultGrid: {
    display: "grid",
    gap: 14,
  },
  orderCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.045)",
    padding: 18,
  },
  orderTop: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1fr) minmax(220px, 0.45fr)",
    gap: 12,
    alignItems: "start",
  },
  ratingBox: {
    border: "1px solid rgba(255,122,0,0.22)",
    borderRadius: 26,
    background: "rgba(255,122,0,0.08)",
    padding: 16,
  },
  stars: {
    display: "flex",
    gap: 4,
    justifyContent: "flex-start",
    direction: "ltr",
    marginTop: 8,
  },
  starButton: {
    border: 0,
    background: "transparent",
    cursor: "pointer",
    fontSize: 34,
    lineHeight: 1,
    padding: 0,
  },
  submit: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#FF7A00",
    color: "#000",
    padding: "15px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 950,
    marginTop: 14,
  },
  disabled: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.35)",
    padding: "15px 16px",
    fontSize: 14,
    fontWeight: 950,
    marginTop: 14,
  },
  statLabel: {
    margin: 0,
    color: "rgba(255,255,255,0.52)",
    fontSize: 13,
    fontWeight: 850,
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: 30,
    fontWeight: 950,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid rgba(34,197,94,0.42)",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "#86EFAC",
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  empty: {
    border: "1px dashed rgba(255,255,255,0.16)",
    borderRadius: 30,
    background: "rgba(255,255,255,0.035)",
    padding: 28,
    textAlign: "center",
  },
  success: {
    border: "1px solid rgba(34,197,94,0.30)",
    borderRadius: 18,
    background: "rgba(34,197,94,0.10)",
    color: "#86EFAC",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900,
  },
  error: {
    border: "1px solid rgba(239,68,68,0.30)",
    borderRadius: 18,
    background: "rgba(239,68,68,0.10)",
    color: "#FCA5A5",
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    fontWeight: 900,
  },
};

export default function RatingsPage() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [search, setSearch] = useState("");
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("fuse_session");

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { phone?: string };
        if (parsed?.phone) setSearch(parsed.phone);
      } catch {}
    }

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          ...(item.data() as Omit<OrderDoc, "documentId">),
          documentId: item.id,
        }));

        setOrders(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setOrders([]);
        setLoading(false);
        setError(snapshotError.message || "تعذر تحميل الطلبات");
      }
    );

    return () => unsubscribe();
  }, []);

  const visibleOrders = useMemo(() => {
    return orders
      .filter((order) => matchesSearch(order, search))
      .slice(0, 8);
  }, [orders, search]);

  async function submitRating(order: OrderDoc) {
    setMessage("");
    setError("");
    setSavingOrderId(order.documentId);

    try {
      await addDoc(collection(db, "ratings"), {
        orderId: order.orderId || order.documentId,
        orderDocumentId: order.documentId,
        customerName: getCustomer(order),
        phone: getPhone(order),
        restaurant: getRestaurant(order),
        driverName: order.driverName || "",
        driverPhone: order.driverPhone || "",
        restaurantRating,
        driverRating,
        note: note.trim(),
        status: order.status || "",
        createdAt: serverTimestamp(),
      });

      setMessage("تم إرسال التقييم، شكراً إلك.");
      setNote("");
      setRestaurantRating(5);
      setDriverRating(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال التقييم");
    } finally {
      setSavingOrderId("");
    }
  }

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/" style={styles.pill}>
            الرئيسية
          </Link>

          <Link href="/order-status" style={styles.pill}>
            حالة الطلب
          </Link>
        </div>

        <header style={styles.hero}>
          <div style={styles.heroGrid}>
            <div style={styles.card}>
              <p style={styles.eyebrow}>تقييم الطلب</p>
              <h1 style={styles.title}>
                قيّم تجربتك
                <br />
                <span style={styles.orange}>وخلينا نحسّن</span>
              </h1>
              <p style={styles.muted}>
                اكتب رقم الهاتف أو رقم الطلب، واختار الطلب حتى تقيّم المطعم والسائق.
              </p>
            </div>

            <div style={styles.card}>
              <p style={styles.statLabel}>الحالة</p>
              <p style={{ ...styles.statValue, color: "#86EFAC" }}>
                {loading ? "تحميل" : "جاهز"}
              </p>
              <p style={styles.muted}>التقييم ينحفظ مباشرة في Firestore</p>
            </div>
          </div>
        </header>

        <section style={styles.searchBox}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
              رقم الهاتف أو رقم الطلب
            </span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setMessage("");
                setError("");
              }}
              style={styles.input}
              placeholder="0770... أو رقم الطلب"
              dir="ltr"
            />
          </label>
        </section>

        <section style={styles.resultGrid}>
          {loading ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>جاري تحميل الطلبات...</h2>
              <p style={styles.muted}>انتظر لحظات.</p>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div style={styles.empty}>
              <h2 style={{ margin: 0 }}>ما لقينا طلب مطابق</h2>
              <p style={styles.muted}>
                اكتب نفس رقم الهاتف المستخدم بالطلب أو رقم الطلب.
              </p>
            </div>
          ) : (
            visibleOrders.map((order) => (
              <article key={order.documentId} style={styles.orderCard}>
                <div style={styles.orderTop}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>
                        {getRestaurant(order)}
                      </h2>

                      {isDelivered(order) ? (
                        <span style={styles.badge}>تم التسليم</span>
                      ) : null}
                    </div>

                    <p style={styles.muted}>
                      {getCustomer(order)} — رقم الطلب: {order.orderId || order.documentId.slice(0, 8)}
                    </p>

                    <p style={styles.muted}>
                      السائق: {order.driverName || "غير محدد"}
                    </p>

                    {!isDelivered(order) ? (
                      <p style={{ ...styles.muted, color: "#FDE68A" }}>
                        تگدر تقيّم الطلب حتى لو بعده مو مؤرشف، لكن الأفضل بعد التسليم.
                      </p>
                    ) : null}
                  </div>

                  <div style={styles.ratingBox}>
                    <p style={styles.statLabel}>تقييم المطعم</p>
                    {stars(restaurantRating, setRestaurantRating)}

                    <div style={{ height: 14 }} />

                    <p style={styles.statLabel}>تقييم السائق</p>
                    {stars(driverRating, setDriverRating)}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 900 }}>
                      ملاحظتك
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      style={styles.textarea}
                      placeholder="اكتب رأيك بالخدمة، المطعم، أو السائق..."
                    />
                  </label>

                  <button
                    onClick={() => submitRating(order)}
                    disabled={savingOrderId === order.documentId}
                    style={savingOrderId === order.documentId ? styles.disabled : styles.submit}
                  >
                    {savingOrderId === order.documentId ? "جاري الإرسال..." : "إرسال التقييم"}
                  </button>

                  {message ? <div style={styles.success}>{message}</div> : null}
                  {error ? <div style={styles.error}>{error}</div> : null}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
