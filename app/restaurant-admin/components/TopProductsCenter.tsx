 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type OrderItem = {
  name?: string;
  price?: number;
  qty?: number;
  category?: string;
};

type Order = {
  id: string;
  restaurant?: string;
  status?: string;
  items?: OrderItem[];
};

type ProductStats = {
  name: string;
  category: string;
  orders: number;
  qty: number;
  revenue: number;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

export default function TopProductsCenter() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Order[];

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  const products = useMemo(() => {
    const map: Record<string, ProductStats> = {};

    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        const name = item.name || "منتج بدون اسم";
        const qty = Number(item.qty || 1);
        const price = Number(item.price || 0);
        const category = item.category || "غير محدد";

        if (!map[name]) {
          map[name] = {
            name,
            category,
            orders: 0,
            qty: 0,
            revenue: 0,
          };
        }

        map[name].orders += 1;
        map[name].qty += qty;
        map[name].revenue += price * qty;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#ffb347",
            letterSpacing: 3,
            fontSize: 11,
            fontWeight: 950,
          }}
        >
          TOP PRODUCTS CENTER
        </p>

        <h2
          style={{
            margin: "8px 0 0",
            color: "white",
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          🏆 المنتجات الأكثر مبيعاً
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#a1a1aa",
            fontWeight: 800,
          }}
        >
          بيانات حقيقية من الطلبات وحقل items داخل Firestore
        </p>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
        }}
      >
        {products.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(255,255,255,.12)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 20,
              padding: 22,
              textAlign: "center",
              color: "#71717a",
              fontWeight: 900,
            }}
          >
            لا توجد بيانات منتجات حالياً
          </div>
        ) : (
          products.slice(0, 10).map((item, index) => {
            const trend = index === 0 ? "🔥" : index <= 2 ? "📈" : "🍽️";

            return (
              <div
                key={item.name}
                style={{
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(0,0,0,.22)",
                  borderRadius: 20,
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 90px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "white",
                      fontSize: 18,
                      fontWeight: 950,
                    }}
                  >
                    #{index + 1} {trend} {item.name}
                  </h3>

                  <p
                    style={{
                      marginTop: 6,
                      color: "#a1a1aa",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {item.category}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                    مرات البيع
                  </p>

                  <p
                    style={{
                      marginTop: 6,
                      color: "#ffb347",
                      fontWeight: 950,
                      fontSize: 20,
                    }}
                  >
                    {item.orders}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                    الكمية
                  </p>

                  <p
                    style={{
                      marginTop: 6,
                      color: "#facc15",
                      fontWeight: 950,
                      fontSize: 20,
                    }}
                  >
                    {item.qty}
                  </p>
                </div>

                <div>
                  <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
                    الإيرادات
                  </p>

                  <p
                    style={{
                      marginTop: 6,
                      color: "#86efac",
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(item.revenue)}
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    color: "#ffb347",
                    fontWeight: 950,
                    fontSize: 28,
                  }}
                >
                  {trend}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}