 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string | number;
  customerName?: string;
  phone?: string;
  restaurant?: string;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  total?: number;
  createdAt?: any;
};

type Rating = {
  id: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  restaurant?: string;
  driverName?: string;
  driverRating?: number;
  restaurantRating?: number;
  comment?: string;
  createdAt?: number;
};

function safeId(value: any) {
  return String(value || "");
}

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={star <= value ? "active" : ""}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function RatingsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [phone, setPhone] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [driverRating, setDriverRating] = useState(5);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      })) as Rating[];

      setRatings(data);
    });

    return () => unsub();
  }, []);

  const deliveredOrders = useMemo(() => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return [];

    return orders.filter(
      (order) =>
        String(order.phone || "").includes(cleanPhone) &&
        order.status === "تم التسليم"
    );
  }, [orders, phone]);

  const ratedOrderIds = useMemo(() => {
    return ratings.map((rating) => safeId(rating.orderId));
  }, [ratings]);

  const selectedOrder = useMemo(() => {
    return deliveredOrders.find(
      (order) => safeId(order.id) === selectedOrderId
    );
  }, [deliveredOrders, selectedOrderId]);

  function chooseOrder(order: Order, alreadyRated: boolean) {
    if (alreadyRated) {
      setMessage("هذا الطلب تم تقييمه سابقاً");
      return;
    }

    setMessage("");
    setSelectedOrderId(safeId(order.id));
    setDriverRating(5);
    setRestaurantRating(5);
    setComment("");

    setTimeout(() => {
      document
        .getElementById("rating-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function submitRating() {
    if (!selectedOrder) {
      setMessage("اختار طلب حتى تقيمه");
      return;
    }

    const orderId = safeId(selectedOrder.id);

    if (ratedOrderIds.includes(orderId)) {
      setMessage("هذا الطلب تم تقييمه سابقاً");
      return;
    }

    await addDoc(collection(db, "ratings"), {
      orderId,
      customerName: selectedOrder.customerName || "",
      phone: selectedOrder.phone || "",
      restaurant: selectedOrder.restaurant || "",
      driverName: selectedOrder.driverName || "",
      driverPhone: selectedOrder.driverPhone || "",
      driverRating,
      restaurantRating,
      comment,
      total: selectedOrder.total || 0,
      createdAt: Date.now(),
    });

    setMessage("شكراً إلك، تم حفظ التقييم بنجاح");
    setSelectedOrderId("");
    setDriverRating(5);
    setRestaurantRating(5);
    setComment("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: "Cairo", sans-serif;
          background: #efe8df;
        }

        .app {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          direction: rtl;
          padding: 18px 18px 34px;
          background: linear-gradient(180deg, #fffaf4 0%, #ffffff 100%);
          color: #151515;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .back {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: white;
          color: #151515;
          text-decoration: none;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(0,0,0,.07);
        }

        .title {
          text-align: center;
        }

        .title h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .title p {
          margin: 4px 0 0;
          color: #888;
          font-size: 13px;
          font-weight: 800;
        }

        .card {
          background: white;
          border-radius: 28px;
          padding: 18px;
          box-shadow: 0 14px 34px rgba(0,0,0,.07);
          margin-bottom: 16px;
        }

        .message {
          background: #151515;
          color: white;
          border-radius: 22px;
          padding: 14px;
          text-align: center;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 900;
        }

        .input, .textarea {
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 18px;
          background: #f8f3ee;
          padding: 14px 15px;
          font-family: inherit;
          font-weight: 800;
          color: #151515;
        }

        .textarea {
          min-height: 110px;
          resize: none;
          margin-top: 12px;
        }

        .empty {
          background: white;
          border-radius: 24px;
          padding: 22px;
          text-align: center;
          color: #888;
          font-weight: 800;
          box-shadow: 0 12px 30px rgba(0,0,0,.06);
        }

        .orders {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .order {
          width: 100%;
          border: 0;
          border-radius: 24px;
          padding: 15px;
          text-align: right;
          font-family: inherit;
          background: white;
          color: #151515;
          box-shadow: 0 12px 30px rgba(0,0,0,.07);
        }

        .order.active {
          background: #ff4d00;
          color: white;
        }

        .order.rated {
          background: #fff3e9;
          color: #151515;
        }

        .order-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .order h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }

        .order p {
          margin: 4px 0 0;
          color: #777;
          font-size: 12px;
          font-weight: 800;
        }

        .order.active p {
          color: rgba(255,255,255,.85);
        }

        .badge {
          background: #151515;
          color: white;
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .rating-box {
          background: #f8f3ee;
          border-radius: 24px;
          padding: 15px;
          text-align: center;
          margin-bottom: 12px;
        }

        .rating-box h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
        }

        .rating-box p {
          margin: 4px 0 10px;
          color: #888;
          font-size: 12px;
          font-weight: 800;
        }

        .stars {
          display: flex;
          justify-content: center;
          gap: 6px;
        }

        .stars button {
          border: 0;
          background: transparent;
          color: #d8d8d8;
          font-size: 36px;
          font-weight: 900;
          line-height: 1;
          padding: 0;
        }

        .stars button.active {
          color: #ff8a00;
        }

        .submit {
          width: 100%;
          border: 0;
          border-radius: 18px;
          background: #ff4d00;
          color: white;
          padding: 15px;
          font-family: inherit;
          font-weight: 900;
          margin-top: 12px;
          box-shadow: 0 12px 26px rgba(255,77,0,.22);
        }
      `}</style>

      <main className="app">
        <header className="top">
          <a className="back" href="/">‹</a>

          <div className="title">
            <h1>تقييم الطلب</h1>
            <p>قيّم السائق والمطعم بعد الاستلام</p>
          </div>

          <div style={{ width: 44 }} />
        </header>

        {message && <div className="message">{message}</div>}

        <section className="card">
          <label className="label">رقم الهاتف</label>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSelectedOrderId("");
              setMessage("");
            }}
            placeholder="اكتب رقم الهاتف المستخدم بالطلب"
            className="input"
          />
        </section>

        {phone.trim() && deliveredOrders.length === 0 && (
          <div className="empty">لا توجد طلبات مسلّمة بهذا الرقم</div>
        )}

        <section className="orders">
          {deliveredOrders.map((order, index) => {
            const orderId = safeId(order.id);
            const alreadyRated = ratedOrderIds.includes(orderId);
            const active = selectedOrderId === orderId;

            return (
              <button
                key={`${orderId}-${index}`}
                type="button"
                onClick={() => chooseOrder(order, alreadyRated)}
                className={`order ${active ? "active" : ""} ${
                  alreadyRated ? "rated" : ""
                }`}
              >
                <div className="order-head">
                  <div>
                    <h2>{order.restaurant || "مطعم غير محدد"}</h2>
                    <p>الطلب: #{orderId.slice(0, 6)}</p>
                    <p>السائق: {order.driverName || "غير محدد"}</p>
                  </div>

                  <span className="badge">
                    {alreadyRated ? "تم التقييم" : active ? "مختار" : "اختيار"}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {selectedOrder && (
          <section id="rating-form" className="card">
            <div className="title" style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: 22 }}>
                تقييم الطلب #{safeId(selectedOrder.id).slice(0, 6)}
              </h1>
            </div>

            <div className="rating-box">
              <h3>تقييم السائق</h3>
              <p>{selectedOrder.driverName || "سائق غير محدد"}</p>
              <Stars value={driverRating} onChange={setDriverRating} />
            </div>

            <div className="rating-box">
              <h3>تقييم المطعم</h3>
              <p>{selectedOrder.restaurant || "مطعم غير محدد"}</p>
              <Stars value={restaurantRating} onChange={setRestaurantRating} />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب تعليقك على الطلب..."
              className="textarea"
            />

            <button type="button" onClick={submitRating} className="submit">
              إرسال التقييم
            </button>
          </section>
        )}
      </main>
    </>
  );
}