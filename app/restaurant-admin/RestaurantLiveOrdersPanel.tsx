"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase/client";

type AnyOrder = {
  id: string;
  status?: string;
  statusAr?: string;
  restaurantName?: string;
  restaurant?: string;
  customerName?: string;
  customerPhone?: string;
  phone?: string;
  address?: string;
  customerAddress?: string;
  note?: string;
  total?: number;
  grandTotal?: number;
  items?: Array<{
    id?: string;
    name?: string;
    price?: number;
    qty?: number;
    quantity?: number;
    total?: number;
  }>;
};

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} دينار`;
}

function label(status?: string, statusAr?: string) {
  if (statusAr) return statusAr;
  if (status === "preparing") return "قيد التحضير";
  if (status === "ready") return "جاهز للتوصيل";
  if (status === "delivering") return "قيد التوصيل";
  if (status === "done") return "تم التسليم";
  if (status === "rejected") return "مرفوض";
  return "جديد";
}

export default function RestaurantLiveOrdersPanel() {
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [message, setMessage] = useState("جاري قراءة الطلبات...");
  const [ready, setReady] = useState(false);
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    let unsubscribe: undefined | (() => void);

    async function start() {
      try {
        const db = getFirestore(firebaseApp);
        const q = query(collection(db, "orders"), limit(30));

        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            try {
              const next = snapshot.docs
                .map((item) => ({
                  id: item.id,
                  ...(item.data() as Omit<AnyOrder, "id">),
                }))
                .reverse();

              setOrders(next);
              setMessage(next.length ? "تم ربط الطلبات الحية." : "ماكو طلبات بعد داخل orders.");
              setReady(true);
            } catch (innerError) {
              console.error(innerError);
              setMessage("وصلت بيانات الطلبات بس صار خطأ عرض. الصفحة باقية شغالة.");
              setReady(true);
            }
          },
          async (liveError) => {
            console.error("Live orders snapshot failed", liveError);

            try {
              const once = await getDocs(q);
              const next = once.docs
                .map((item) => ({
                  id: item.id,
                  ...(item.data() as Omit<AnyOrder, "id">),
                }))
                .reverse();

              setOrders(next);
              setMessage(next.length ? "تمت قراءة الطلبات مرة واحدة." : "ماكو طلبات بعد داخل orders.");
            } catch (fallbackError) {
              console.error("Live orders fallback failed", fallbackError);
              setOrders([]);
              setMessage("Firestore رفض قراءة orders. نحتاج نفتح Rules للقراءة/الكتابة بعدين.");
            }

            setReady(true);
          }
        );
      } catch (error) {
        console.error("RestaurantLiveOrdersPanel crashed safely", error);
        setOrders([]);
        setMessage("بلوك الطلبات تعطل بأمان بدون كسر لوحة المطعم.");
        setReady(true);
      }
    }

    start();

    return () => {
      try {
        if (unsubscribe) unsubscribe();
      } catch {}
    };
  }, []);

  async function changeStatus(orderId: string, status: string, statusAr: string) {
    setUpdating(orderId);

    try {
      const db = getFirestore(firebaseApp);
      await updateDoc(doc(db, "orders", orderId), {
        status,
        statusAr,
        updatedAtText: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      alert("ما قدرنا نحدث حالة الطلب. غالبًا Firestore Rules تحتاج سماح.");
    } finally {
      setUpdating("");
    }
  }

  return (
    <section dir="rtl" style={{
      margin: "18px auto 22px",
      width: "min(1280px, calc(100% - 32px))",
      border: "1px solid rgba(255,122,0,0.28)",
      background: "linear-gradient(135deg, rgba(255,122,0,0.14), rgba(0,0,0,0.72))",
      color: "#fff",
      borderRadius: 28,
      padding: 22,
      fontFamily: "Cairo, system-ui, sans-serif",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 16,
      }}>
        <div>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 950 }}>
            Firestore Orders
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: 30, fontWeight: 950 }}>
            طلبات الزبائن الحية
          </h2>
        </div>

        <div style={{
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 999,
          padding: "10px 14px",
          fontWeight: 900,
        }}>
          {ready ? `الطلبات: ${orders.length}` : "تحميل..."}
        </div>
      </div>

      <div style={{
        border: "1px dashed rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.26)",
        borderRadius: 18,
        padding: 16,
        color: "rgba(255,255,255,0.72)",
        lineHeight: 1.8,
        marginBottom: orders.length ? 16 : 0,
      }}>
        {message}
      </div>

      {orders.length > 0 ? (
        <div style={{ display: "grid", gap: 14 }}>
          {orders.map((order) => {
            const total = order.grandTotal || order.total || 0;
            const phone = order.customerPhone || order.phone || "";
            const address = order.customerAddress || order.address || "";
            const restaurant = order.restaurantName || order.restaurant || "مطعم غير محدد";
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <article key={order.id} style={{
                border: "1px solid rgba(255,255,255,0.13)",
                background: "rgba(0,0,0,0.38)",
                borderRadius: 22,
                padding: 18,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}>
                  <div style={{ minWidth: 260, flex: 1 }}>
                    <div style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}>
                      <strong style={{ fontSize: 22 }}>طلب #{order.id.slice(0, 8)}</strong>
                      <span style={{
                        border: "1px solid rgba(255,122,0,0.36)",
                        background: "rgba(255,122,0,0.16)",
                        color: "#FFB066",
                        borderRadius: 999,
                        padding: "7px 12px",
                        fontWeight: 900,
                      }}>
                        {label(order.status, order.statusAr)}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.76)", lineHeight: 1.8 }}>
                      المطعم: <b>{restaurant}</b>
                    </p>

                    <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.76)", lineHeight: 1.8 }}>
                      الزبون: <b>{order.customerName || "زبون"}</b>
                      {phone ? <> — هاتف: <b dir="ltr">{phone}</b></> : null}
                    </p>

                    <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.62)", lineHeight: 1.8 }}>
                      العنوان: {address || "غير محدد"}
                    </p>

                    {items.length ? (
                      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        {items.map((item, index) => {
                          const qty = item.qty || item.quantity || 1;
                          const itemTotal = item.total || Number(item.price || 0) * qty;

                          return (
                            <div key={`${order.id}-${item.id || index}`} style={{
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(255,255,255,0.04)",
                              borderRadius: 14,
                              padding: 12,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                            }}>
                              <span>{item.name || "صنف"} × {qty}</span>
                              <b>{formatIQD(itemTotal)}</b>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div style={{
                    width: 260,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 18,
                    padding: 16,
                  }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.62)" }}>المجموع</p>
                    <h3 style={{ margin: "8px 0 14px", color: "#FF7A00", fontSize: 28 }}>
                      {formatIQD(total)}
                    </h3>

                    <div style={{ display: "grid", gap: 9 }}>
                      <button
                        disabled={updating === order.id}
                        onClick={() => changeStatus(order.id, "preparing", "قيد التحضير")}
                        style={buttonStyle}
                      >
                        قيد التحضير
                      </button>

                      <button
                        disabled={updating === order.id}
                        onClick={() => changeStatus(order.id, "ready", "جاهز للتوصيل")}
                        style={buttonStyle}
                      >
                        جاهز للتوصيل
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

const buttonStyle = {
  width: "100%",
  border: 0,
  borderRadius: 14,
  padding: "12px 14px",
  background: "#FF7A00",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
} as const;
