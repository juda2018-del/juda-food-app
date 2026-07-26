"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { parseFuseRole, roleHome } from "@/lib/fuse-auth";

type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerUid?: string;
  customerEmail?: string;
  customerName?: string;
  customer?: string;
  phone?: string;
  customerPhone?: string;
  restaurantId?: string;
  restaurant?: string;
  restaurantName?: string;
  driverId?: string;
  driverUid?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  createdAt?: unknown;
};

function clean(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || "زبون";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم";
}

function isDelivered(order: OrderDoc) {
  const status = clean(order.status);
  return status === "تم التسليم" || status === "delivered";
}

function toMillis(value: unknown) {
  try {
    if (value && typeof value === "object" && "toDate" in value) {
      const fn = (value as { toDate?: unknown }).toDate;
      if (typeof fn === "function") return (fn as () => Date)().getTime();
    }
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function stars(value: number, setter: (value: number) => void) {
  return (
    <div style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => setter(star)} aria-label={`${star} نجوم`} style={{ ...styles.starButton, color: star <= value ? "#FF7A00" : "rgba(255,255,255,0.24)" }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function RatingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set());
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [note, setNote] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("orderDocumentId") || "";
    if (requested.trim()) setSelectedOrderId(requested.trim());

    return onAuthStateChanged(auth, async (currentUser) => {
      setAuthReady(true);
      if (!currentUser) {
        window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }

      try {
        const token = await currentUser.getIdTokenResult();
        const role = parseFuseRole(token.claims.role || token.claims.fuseRole);
        if (role && role !== "customer") {
          window.location.replace(roleHome[role]);
          return;
        }
        setUser(currentUser);
      } catch {
        setError("تعذر التحقق من الحساب. سجل خروج وادخل مرة ثانية.");
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(collection(db, "orders"), where("customerUid", "==", user.uid));
    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => ({ ...(item.data() as Omit<OrderDoc, "documentId">), documentId: item.id }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setOrders(next);
        setLoading(false);
        setError("");
      },
      () => {
        setOrders([]);
        setLoading(false);
        setError("تعذر تحميل طلباتك.");
      }
    );
  }, [user]);

  useEffect(() => {
    const deliveredIds = orders.filter(isDelivered).map((order) => order.documentId);
    if (!deliveredIds.length) {
      setRatedOrderIds(new Set());
      return;
    }

    let cancelled = false;
    Promise.all(deliveredIds.map(async (id) => ({ id, exists: (await getDoc(doc(db, "ratings", id))).exists() })))
      .then((results) => {
        if (!cancelled) setRatedOrderIds(new Set(results.filter((item) => item.exists).map((item) => item.id)));
      })
      .catch(() => {
        if (!cancelled) setError("تعذر التحقق من التقييمات السابقة.");
      });

    return () => { cancelled = true; };
  }, [orders]);

  const eligibleOrders = useMemo(
    () => orders.filter(isDelivered).filter((order) => !ratedOrderIds.has(order.documentId)),
    [orders, ratedOrderIds]
  );

  const selectedOrder = eligibleOrders.find((order) => order.documentId === selectedOrderId) || eligibleOrders[0] || null;

  useEffect(() => {
    if (!selectedOrderId && eligibleOrders[0]) setSelectedOrderId(eligibleOrders[0].documentId);
    if (selectedOrderId && !eligibleOrders.some((order) => order.documentId === selectedOrderId)) {
      setSelectedOrderId(eligibleOrders[0]?.documentId || "");
    }
  }, [eligibleOrders, selectedOrderId]);

  async function submitRating() {
    if (!user || !selectedOrder || saving) return;
    if (selectedOrder.customerUid !== user.uid) return setError("هذا الطلب لا يخص حسابك.");
    if (!isDelivered(selectedOrder)) return setError("التقييم متاح بعد تسليم الطلب فقط.");
    if (ratedOrderIds.has(selectedOrder.documentId)) return setError("هذا الطلب مقيّم مسبقاً.");

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const ratingRef = doc(db, "ratings", selectedOrder.documentId);
      if ((await getDoc(ratingRef)).exists()) throw new Error("هذا الطلب مقيّم مسبقاً.");

      const hasDriver = Boolean(selectedOrder.driverUid || selectedOrder.driverId || selectedOrder.driverName);
      await setDoc(ratingRef, {
        orderId: selectedOrder.orderId || selectedOrder.documentId,
        orderDocumentId: selectedOrder.documentId,
        customerUid: user.uid,
        customerEmail: selectedOrder.customerEmail || user.email || "",
        customerName: getCustomer(selectedOrder),
        phone: selectedOrder.customerPhone || selectedOrder.phone || "",
        restaurantId: selectedOrder.restaurantId || "",
        restaurant: getRestaurant(selectedOrder),
        driverId: selectedOrder.driverId || "",
        driverUid: selectedOrder.driverUid || "",
        driverName: selectedOrder.driverName || "",
        driverPhone: selectedOrder.driverPhone || "",
        restaurantRating,
        driverRating: hasDriver ? driverRating : 0,
        note: note.trim().slice(0, 1000),
        status: selectedOrder.status || "",
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
      });

      setRatedOrderIds((current) => new Set(current).add(selectedOrder.documentId));
      setMessage("تم إرسال التقييم، شكراً إلك.");
      setNote("");
      setRestaurantRating(5);
      setDriverRating(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "تعذر إرسال التقييم.");
    } finally {
      setSaving(false);
    }
  }

  if (!authReady) return <main dir="rtl" style={styles.page}><section style={styles.empty}>جاري التحقق من الحساب...</section></main>;

  return (
    <main dir="rtl" style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/order-status" style={styles.pill}>← طلباتي</Link>
          <Link href="/" style={styles.pill}>الرئيسية</Link>
        </div>

        <header style={styles.hero}>
          <p style={styles.eyebrow}>تقييم الطلب</p>
          <h1 style={styles.title}>قيّم طلبك <span style={styles.orange}>بعد التسليم</span></h1>
          <p style={styles.muted}>نعرض فقط الطلبات المسلّمة التابعة لحسابك، وكل طلب يمكن تقييمه مرة واحدة.</p>
        </header>

        {loading ? <section style={styles.empty}>جاري تحميل طلباتك...</section> : null}
        {error ? <section style={styles.error}>{error}</section> : null}
        {message ? <section style={styles.success}>{message}</section> : null}

        {!loading && !error && eligibleOrders.length === 0 ? (
          <section style={styles.empty}>
            <h2 style={{ margin: 0 }}>ماكو طلب جاهز للتقييم</h2>
            <p style={styles.muted}>الطلب يظهر هنا بعد التسليم، ويختفي بعد إرسال تقييمه.</p>
          </section>
        ) : null}

        {eligibleOrders.length > 0 ? (
          <section style={styles.card}>
            <label style={styles.label}>
              <span>اختار الطلب</span>
              <select value={selectedOrder?.documentId || ""} onChange={(event) => setSelectedOrderId(event.target.value)} style={styles.input}>
                {eligibleOrders.map((order) => (
                  <option key={order.documentId} value={order.documentId}>
                    {getRestaurant(order)} — #{order.orderId || order.documentId.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>

            {selectedOrder ? (
              <div style={styles.ratingGrid}>
                <div>
                  <h2 style={{ marginTop: 0 }}>{getRestaurant(selectedOrder)}</h2>
                  <p style={styles.muted}>رقم الطلب: {selectedOrder.orderId || selectedOrder.documentId.slice(0, 8)}</p>
                  <p style={styles.muted}>السائق: {selectedOrder.driverName || "غير محدد"}</p>
                </div>
                <div>
                  <p style={styles.labelText}>تقييم المطعم</p>
                  {stars(restaurantRating, setRestaurantRating)}
                  {selectedOrder.driverUid || selectedOrder.driverId || selectedOrder.driverName ? (
                    <><p style={{ ...styles.labelText, marginTop: 18 }}>تقييم السائق</p>{stars(driverRating, setDriverRating)}</>
                  ) : null}
                </div>
              </div>
            ) : null}

            <label style={{ ...styles.label, marginTop: 18 }}>
              <span>ملاحظتك</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} style={styles.textarea} placeholder="اكتب رأيك بالخدمة..." />
            </label>

            <button type="button" onClick={submitRating} disabled={saving || !selectedOrder} style={saving ? styles.disabled : styles.submit}>
              {saving ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top right, rgba(255,122,0,0.16), transparent 34%), #050505", color: "white", padding: "26px 16px", fontFamily: "Arial, sans-serif" },
  shell: { width: "100%", maxWidth: 900, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  pill: { border: "1px solid rgba(255,255,255,0.13)", borderRadius: 999, background: "rgba(255,255,255,0.05)", padding: "13px 20px", color: "white", textDecoration: "none", fontWeight: 900 },
  hero: { border: "1px solid rgba(255,255,255,0.10)", borderRadius: 30, background: "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,122,0,0.10))", padding: 22, marginBottom: 16 },
  eyebrow: { margin: 0, color: "#FF7A00", fontSize: 13, fontWeight: 900 },
  title: { margin: "8px 0", fontSize: "clamp(34px, 6vw, 58px)", lineHeight: 1.08, fontWeight: 950 },
  orange: { color: "#FF7A00" },
  muted: { color: "rgba(255,255,255,0.62)", lineHeight: 1.8 },
  card: { border: "1px solid rgba(255,255,255,0.10)", borderRadius: 28, background: "rgba(255,255,255,0.045)", padding: 20 },
  label: { display: "grid", gap: 8, fontWeight: 900 },
  labelText: { margin: 0, color: "rgba(255,255,255,0.7)", fontWeight: 900 },
  input: { width: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, background: "#090909", color: "white", padding: 14, fontSize: 15 },
  textarea: { width: "100%", minHeight: 110, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, background: "#090909", color: "white", padding: 14, resize: "vertical" },
  ratingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 20 },
  stars: { display: "flex", gap: 5, direction: "ltr" },
  starButton: { border: 0, background: "transparent", cursor: "pointer", fontSize: 34, padding: 0 },
  submit: { width: "100%", border: 0, borderRadius: 17, background: "#FF7A00", color: "#000", padding: 15, marginTop: 16, fontWeight: 950, cursor: "pointer" },
  disabled: { width: "100%", border: 0, borderRadius: 17, background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.4)", padding: 15, marginTop: 16, fontWeight: 950 },
  empty: { maxWidth: 900, margin: "20px auto", border: "1px dashed rgba(255,255,255,0.16)", borderRadius: 26, padding: 28, textAlign: "center", background: "rgba(255,255,255,0.035)" },
  success: { border: "1px solid rgba(34,197,94,0.3)", borderRadius: 16, background: "rgba(34,197,94,0.1)", color: "#86EFAC", padding: 14, marginBottom: 14 },
  error: { border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, background: "rgba(239,68,68,0.1)", color: "#FCA5A5", padding: 14, marginBottom: 14 },
};
