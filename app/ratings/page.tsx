"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { FUSE_LOCAL_SESSION, parseFuseRole, type FuseSession } from "@/lib/fuse-auth";

type OrderDoc = {
  documentId: string;
  orderId?: string;
  customerId?: string;
  customerUid?: string;
  customerEmail?: string;
  customerName?: string;
  customer?: string;
  name?: string;
  phone?: string;
  customerPhone?: string;
  restaurantId?: string;
  restaurant?: string;
  restaurantName?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  createdAt?: unknown;
};

function readSession(): FuseSession | null {
  try {
    const raw = localStorage.getItem(FUSE_LOCAL_SESSION) || localStorage.getItem("FUSE_LOCAL_SESSION");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FuseSession;
    const role = parseFuseRole(parsed.role || parsed.fuseRole);
    if (!parsed.email || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function clean(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getCustomer(order: OrderDoc) {
  return order.customerName || order.customer || order.name || "زبون";
}

function getRestaurant(order: OrderDoc) {
  return order.restaurantName || order.restaurant || "مطعم";
}

function isDelivered(order: OrderDoc) {
  const status = clean(order.status);
  return status === "تم التسليم" || status === "delivered";
}

function belongsToSession(order: OrderDoc, session: FuseSession) {
  const uid = clean(session.uid || session.customerId);
  const email = clean(session.email);
  const phone = String(session.phone || "").replace(/\D/g, "");

  const orderUid = clean(order.customerUid || order.customerId);
  const orderEmail = clean(order.customerEmail);
  const orderPhone = String(order.customerPhone || order.phone || "").replace(/\D/g, "");

  if (uid && orderUid) return uid === orderUid;
  if (email && orderEmail) return email === orderEmail;
  if (phone && orderPhone) return phone === orderPhone;
  return false;
}

function stars(value: number, setter: (value: number) => void) {
  return (
    <div style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setter(star)}
          aria-label={`${star} نجوم`}
          style={{ ...styles.starButton, color: star <= value ? "#FF7A00" : "rgba(255,255,255,0.24)" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RatingsPage() {
  const [session, setSession] = useState<FuseSession | null>(null);
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
    const saved = readSession();
    if (!saved) {
      window.location.href = "/login?next=/ratings";
      return;
    }
    if (saved.role !== "customer" && saved.role !== "admin") {
      window.location.href = "/";
      return;
    }
    setSession(saved);
  }, []);

  useEffect(() => {
    if (!session) return;

    const constraints = [orderBy("createdAt", "desc")];
    const sessionUid = clean(session.uid || session.customerId);
    const sessionEmail = clean(session.email);
    const sessionPhone = String(session.phone || "").replace(/\D/g, "");

    let ordersQuery;
    if (session.role === "admin") {
      ordersQuery = query(collection(db, "orders"), ...constraints);
    } else if (sessionUid) {
      ordersQuery = query(collection(db, "orders"), where("customerUid", "==", sessionUid), ...constraints);
    } else if (sessionEmail) {
      ordersQuery = query(collection(db, "orders"), where("customerEmail", "==", sessionEmail), ...constraints);
    } else if (sessionPhone) {
      ordersQuery = query(collection(db, "orders"), where("customerPhone", "==", sessionPhone), ...constraints);
    } else {
      setOrders([]);
      setLoading(false);
      setError("الحساب غير مربوط بمعرّف زبون أو رقم هاتف.");
      return;
    }

    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({ ...(item.data() as Omit<OrderDoc, "documentId">), documentId: item.id }))
          .filter((order) => session.role === "admin" || belongsToSession(order, session));
        setOrders(data);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setOrders([]);
        setLoading(false);
        setError(snapshotError.message.includes("index") ? "هذا الاستعلام يحتاج Firestore Index." : "تعذر تحميل طلباتك.");
      }
    );
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const ids = orders.map((order) => order.documentId);
    if (!ids.length) {
      setRatedOrderIds(new Set());
      return;
    }

    let cancelled = false;
    Promise.all(ids.map(async (id) => ({ id, exists: (await getDoc(doc(db, "ratings", id))).exists() }))).then((results) => {
      if (cancelled) return;
      setRatedOrderIds(new Set(results.filter((item) => item.exists).map((item) => item.id)));
    });

    return () => {
      cancelled = true;
    };
  }, [orders, session]);

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
    if (!session || !selectedOrder) return;
    if (session.role !== "admin" && !belongsToSession(selectedOrder, session)) {
      setError("هذا الطلب لا يخص حسابك.");
      return;
    }
    if (!isDelivered(selectedOrder)) {
      setError("التقييم متاح بعد تسليم الطلب فقط.");
      return;
    }
    if (ratedOrderIds.has(selectedOrder.documentId)) {
      setError("هذا الطلب مقيّم مسبقاً.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const ratingRef = doc(db, "ratings", selectedOrder.documentId);
      const existing = await getDoc(ratingRef);
      if (existing.exists()) throw new Error("هذا الطلب مقيّم مسبقاً.");

      await setDoc(ratingRef, {
        orderId: selectedOrder.orderId || selectedOrder.documentId,
        orderDocumentId: selectedOrder.documentId,
        customerId: selectedOrder.customerId || session.customerId || session.uid || "",
        customerUid: selectedOrder.customerUid || session.uid || "",
        customerEmail: selectedOrder.customerEmail || session.email,
        customerName: getCustomer(selectedOrder),
        phone: selectedOrder.customerPhone || selectedOrder.phone || session.phone || "",
        restaurantId: selectedOrder.restaurantId || "",
        restaurant: getRestaurant(selectedOrder),
        driverId: selectedOrder.driverId || "",
        driverName: selectedOrder.driverName || "",
        driverPhone: selectedOrder.driverPhone || "",
        restaurantRating,
        driverRating: selectedOrder.driverName ? driverRating : null,
        note: note.trim().slice(0, 1000),
        status: selectedOrder.status || "",
        createdAt: serverTimestamp(),
        createdByUid: session.uid || "",
        createdByEmail: session.email,
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
                  {selectedOrder.driverName ? (
                    <>
                      <p style={{ ...styles.labelText, marginTop: 18 }}>تقييم السائق</p>
                      {stars(driverRating, setDriverRating)}
                    </>
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
  page: { minHeight: "100vh", background: "radial-gradient(circle at top right, rgba(255,122,0,.16), transparent 34%), #050505", color: "white", padding: "24px 14px 100px", fontFamily: "Cairo, Arial, sans-serif" },
  shell: { width: "100%", maxWidth: 880, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  pill: { border: "1px solid rgba(255,255,255,.13)", borderRadius: 999, background: "rgba(255,255,255,.05)", padding: "12px 18px", color: "white", textDecoration: "none", fontWeight: 900 },
  hero: { border: "1px solid rgba(255,255,255,.10)", borderRadius: 30, background: "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,122,0,.10))", padding: 24, marginBottom: 16 },
  eyebrow: { margin: 0, color: "#FF7A00", fontWeight: 950 },
  title: { margin: "10px 0", fontSize: "clamp(34px, 7vw, 58px)", lineHeight: 1.1, fontWeight: 950 },
  orange: { color: "#FF7A00" },
  muted: { color: "rgba(255,255,255,.62)", lineHeight: 1.8 },
  card: { border: "1px solid rgba(255,255,255,.10)", borderRadius: 28, background: "rgba(255,255,255,.05)", padding: 20 },
  label: { display: "grid", gap: 8, fontWeight: 900 },
  labelText: { margin: 0, color: "rgba(255,255,255,.72)", fontWeight: 900 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, background: "#090909", color: "white", padding: "14px 15px", fontSize: 15 },
  textarea: { width: "100%", minHeight: 110, boxSizing: "border-box", border: "1px solid rgba(255,255,255,.14)", borderRadius: 16, background: "#090909", color: "white", padding: "14px 15px", fontSize: 15, resize: "vertical" },
  ratingGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginTop: 20 },
  stars: { display: "flex", direction: "ltr", gap: 4 },
  starButton: { border: 0, background: "transparent", cursor: "pointer", fontSize: 36, lineHeight: 1, padding: 0 },
  submit: { width: "100%", border: 0, borderRadius: 17, background: "#FF7A00", color: "#111", padding: 16, marginTop: 18, fontWeight: 950, fontSize: 16, cursor: "pointer" },
  disabled: { width: "100%", border: 0, borderRadius: 17, background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.45)", padding: 16, marginTop: 18, fontWeight: 950, fontSize: 16 },
  empty: { border: "1px dashed rgba(255,255,255,.16)", borderRadius: 24, background: "rgba(255,255,255,.035)", padding: 24, textAlign: "center", marginTop: 14 },
  success: { border: "1px solid rgba(34,197,94,.3)", borderRadius: 18, background: "rgba(34,197,94,.10)", color: "#86EFAC", padding: 14, marginBottom: 14, fontWeight: 900 },
  error: { border: "1px solid rgba(239,68,68,.3)", borderRadius: 18, background: "rgba(239,68,68,.10)", color: "#FCA5A5", padding: 14, marginBottom: 14, fontWeight: 900 },
};
