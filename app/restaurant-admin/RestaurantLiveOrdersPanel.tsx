"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase/client";

type LiveOrderItem = {
  id?: string;
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
  total?: number;
};

type LiveOrder = {
  id: string;
  status?: string;
  statusAr?: string;
  restaurantId?: string;
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
  createdAtText?: string;
  source?: string;
  items?: LiveOrderItem[];
};

const db = getFirestore(firebaseApp);

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("ar-IQ")} دينار`;
}

function statusLabel(status?: string, statusAr?: string) {
  if (statusAr) return statusAr;

  if (status === "new") return "جديد";
  if (status === "preparing") return "قيد التحضير";
  if (status === "ready") return "جاهز للتوصيل";
  if (status === "delivering") return "قيد التوصيل";
  if (status === "done") return "تم التسليم";
  if (status === "rejected") return "مرفوض";

  return status || "جديد";
}

export default function RestaurantLiveOrdersPanel() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const nextOrders = snapshot.docs.map((orderDoc) => {
          return {
            id: orderDoc.id,
            ...(orderDoc.data() as Omit<LiveOrder, "id">),
          };
        });

        setOrders(nextOrders);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("FUSE restaurant live orders error", snapshotError);
        setError(snapshotError.message || "فشل قراءة الطلبات من Firestore");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const newOrdersCount = useMemo(() => {
    return orders.filter((order) => (order.status || "new") === "new").length;
  }, [orders]);

  async function changeStatus(orderId: string, status: string, statusAr: string) {
    setUpdatingId(orderId);

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        statusAr,
        updatedAtText: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error(updateError);
      alert("فشل تحديث حالة الطلب. راجع Firestore Rules.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <section dir="rtl" style={{
      margin: "0 auto 22px",
      width: "min(1280px, calc(100% - 32px))",
      border: "1px solid rgba(255,122,0,0.28)",
      background: "linear-gradient(135deg, rgba(255,122,0,0.14), rgba(0,0,0,0.72))",
      color: "#fff",
      borderRadius: 28,
      padding: 22,
      fontFamily: "Cairo, system-ui, sans-serif",
      boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        marginBottom: 16,
      }}>
        <div>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 950 }}>
            Firestore Live Orders
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: 30, fontWeight: 950 }}>
            طلبات الزبائن الحية
          </h2>
        </div>

        <div style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}>
          <div style={pillStyle}>كل الطلبات: {orders.length}</div>
          <div style={pillStyle}>الجديدة: {newOrdersCount}</div>
          <div style={pillStyle}>Collection: orders</div>
        </div>
      </div>

      {loading ? (
        <div style={emptyStyle}>جاري قراءة الطلبات من Firestore...</div>
      ) : error ? (
        <div style={{ ...emptyStyle, borderColor: "rgba(255,120,120,0.4)", color: "#ffb6b6" }}>
          خطأ قراءة الطلبات: {error}
        </div>
      ) : orders.length === 0 ? (
        <div style={emptyStyle}>
          ماكو طلبات داخل collection orders بعد. جرّب أرسل طلب من صفحة الزبون.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gap: 14,
        }}>
          {orders.map((order) => {
            const currentStatus = order.status || "new";
            const total = order.grandTotal || order.total || 0;
            const customerPhone = order.customerPhone || order.phone || "";
            const customerAddress = order.customerAddress || order.address || "";
            const restaurantName = order.restaurantName || order.restaurant || "مطعم غير محدد";
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <article key={order.id} style={{
                border: "1px solid rgba(255,255,255,0.13)",
                background: "rgba(0,0,0,0.38)",
                borderRadius: 22,
                padding: 18,
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.2fr) minmax(240px, 0.8fr)",
                  gap: 16,
                }}>
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}>
                      <strong style={{ fontSize: 22 }}>
                        طلب #{order.id.slice(0, 8)}
                      </strong>
                      <span style={{
                        border: "1px solid rgba(255,122,0,0.36)",
                        background: "rgba(255,122,0,0.16)",
                        color: "#FFB066",
                        borderRadius: 999,
                        padding: "7px 12px",
                        fontWeight: 900,
                      }}>
                        {statusLabel(currentStatus, order.statusAr)}
                      </span>
                      <span style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 999,
                        padding: "7px 12px",
                        color: "rgba(255,255,255,0.72)",
                      }}>
                        {restaurantName}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
                      الزبون: <b>{order.customerName || "زبون"}</b>
                      {customerPhone ? <> — هاتف: <b dir="ltr">{customerPhone}</b></> : null}
                    </p>

                    <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
                      العنوان: {customerAddress || "غير محدد"}
                    </p>

                    {order.note ? (
                      <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.68)", lineHeight: 1.8 }}>
                        ملاحظة: {order.note}
                      </p>
                    ) : null}

                    <div style={{
                      marginTop: 12,
                      display: "grid",
                      gap: 8,
                    }}>
                      {items.length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.55)" }}>
                          لا توجد تفاصيل أصناف.
                        </div>
                      ) : (
                        items.map((item, index) => {
                          const qty = item.qty || item.quantity || 1;
                          const price = item.price || 0;

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
                              <b>{formatIQD((item.total || price * qty))}</b>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 18,
                    padding: 16,
                    alignSelf: "start",
                  }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.62)" }}>
                      المجموع
                    </p>
                    <h3 style={{ margin: "8px 0 14px", color: "#FF7A00", fontSize: 28 }}>
                      {formatIQD(total)}
                    </h3>

                    <div style={{ display: "grid", gap: 9 }}>
                      <button
                        disabled={updatingId === order.id || currentStatus === "preparing"}
                        onClick={() => changeStatus(order.id, "preparing", "قيد التحضير")}
                        style={buttonStyle}
                      >
                        قيد التحضير
                      </button>

                      <button
                        disabled={updatingId === order.id || currentStatus === "ready"}
                        onClick={() => changeStatus(order.id, "ready", "جاهز للتوصيل")}
                        style={buttonStyle}
                      >
                        جاهز للتوصيل
                      </button>

                      <button
                        disabled={updatingId === order.id || currentStatus === "rejected"}
                        onClick={() => changeStatus(order.id, "rejected", "مرفوض")}
                        style={{
                          ...buttonStyle,
                          background: "rgba(255,0,0,0.14)",
                          color: "#ffb6b6",
                          border: "1px solid rgba(255,120,120,0.32)",
                        }}
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const pillStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  borderRadius: 999,
  padding: "10px 14px",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 900,
};

const emptyStyle: React.CSSProperties = {
  border: "1px dashed rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.30)",
  borderRadius: 18,
  padding: 20,
  color: "rgba(255,255,255,0.68)",
  lineHeight: 1.8,
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 14,
  padding: "12px 14px",
  background: "#FF7A00",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
};
