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

type InventoryItem = {
  name: string;
  category: string;
  qty: number;
  orders: number;
  revenue: number;
  stockRisk: "منخفض" | "متوسط" | "عالي";
  action: string;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

export default function SmartInventoryCenter() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setOrders(data.filter((order) => order.restaurant === restaurantName));
    });

    return () => unsub();
  }, []);

  const inventory = useMemo(() => {
    const map: Record<string, InventoryItem> = {};

    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        const name = item.name || "منتج بدون اسم";
        const category = item.category || "غير محدد";
        const qty = Number(item.qty || 1);
        const price = Number(item.price || 0);

        if (!map[name]) {
          map[name] = {
            name,
            category,
            qty: 0,
            orders: 0,
            revenue: 0,
            stockRisk: "منخفض",
            action: "مستقر",
          };
        }

        map[name].qty += qty;
        map[name].orders += 1;
        map[name].revenue += price * qty;
      });
    });

    return Object.values(map)
      .map((item) => {
        let stockRisk: InventoryItem["stockRisk"] = "منخفض";
        let action = "المخزون مستقر";

        if (item.qty >= 25) {
          stockRisk = "عالي";
          action = "جهّز كمية إضافية قبل الذروة";
        } else if (item.qty >= 10) {
          stockRisk = "متوسط";
          action = "تابع الكمية خلال اليوم";
        }

        return {
          ...item,
          stockRisk,
          action,
        };
      })
      .sort((a, b) => b.qty - a.qty);
  }, [orders]);

  const hotItems = inventory.slice(0, 5);
  const weakItems = inventory.slice(-5).reverse();
  const highRisk = inventory.filter((item) => item.stockRisk === "عالي").length;
  const mediumRisk = inventory.filter((item) => item.stockRisk === "متوسط").length;
  const totalRevenue = inventory.reduce((sum, item) => sum + item.revenue, 0);
  const totalQty = inventory.reduce((sum, item) => sum + item.qty, 0);

  const alerts = useMemo(() => {
    const list: string[] = [];

    hotItems.forEach((item) => {
      if (item.qty >= 20) {
        list.push(`🔥 ${item.name} عليه طلب عالي، جهّز كمية أكثر`);
      }
    });

    weakItems.forEach((item) => {
      if (item.qty <= 3) {
        list.push(`⚠️ ${item.name} مبيعاته ضعيفة، يحتاج عرض أو تعديل بالمنيو`);
      }
    });

    if (highRisk > 0) {
      list.push("🚨 يوجد خطر نفاد لبعض المنتجات قبل الذروة");
    }

    if (mediumRisk > 0) {
      list.push("📦 بعض المنتجات تحتاج متابعة خلال اليوم");
    }

    if (inventory.length === 0) {
      list.push("لا توجد بيانات كافية للمخزون حالياً");
    }

    return list.slice(0, 8);
  }, [hotItems, weakItems, inventory.length, highRisk, mediumRisk]);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 26,
        padding: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,.28)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#ffb347",
          letterSpacing: 3,
          fontSize: 11,
          fontWeight: 950,
        }}
      >
        SMART INVENTORY
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          color: "white",
          fontSize: 26,
          fontWeight: 950,
        }}
      >
        📦 مركز المخزون الذكي
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        تحليل استهلاك المنتجات من الطلبات الفعلية وتوصيات FUSE AI قبل نفاد المواد.
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        <Card title="منتجات مراقبة" value={inventory.length} icon="🍽️" />
        <Card title="كمية مباعة" value={totalQty} icon="📦" />
        <Card title="خطر عالي" value={highRisk} icon="🚨" />
        <Card title="إيرادات المنتجات" value={formatMoney(totalRevenue)} icon="💰" />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <Panel title="🔥 المنتجات الأكثر استهلاكاً" items={hotItems} />
        <Panel title="⚠️ المنتجات الضعيفة" items={weakItems} />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 14,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.22)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            📊 قراءة مخزون المنتجات
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {inventory.length === 0 ? (
              <Empty text="لا توجد بيانات حالياً" />
            ) : (
              inventory.slice(0, 8).map((item) => (
                <InventoryRow key={item.name} item={item} />
              ))
            )}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,122,0,.22)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 20,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🧠 توصيات المخزون
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {alerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(0,0,0,.22)",
                  borderRadius: 14,
                  padding: 12,
                  color: "#d4d4d8",
                  fontWeight: 850,
                  lineHeight: 1.7,
                }}
              >
                {alert}
              </div>
            ))}

            <div
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
                lineHeight: 1.7,
              }}
            >
              🧠 جهز المواد الأكثر مبيعاً قبل وقت الذروة حتى تقلل زمن التحضير.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800 }}>
        {icon} {title}
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#ffb347",
          fontSize: 22,
          fontWeight: 950,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: InventoryItem[] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>{title}</h3>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {items.length === 0 ? (
          <Empty text="لا توجد بيانات حالياً" />
        ) : (
          items.map((item) => <ProductCard key={item.name} item={item} />)
        )}
      </div>
    </div>
  );
}

function ProductCard({ item }: { item: InventoryItem }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <p style={{ margin: 0, color: "white", fontWeight: 950 }}>
        🍽️ {item.name}
      </p>

      <p
        style={{
          margin: "7px 0 0",
          color: "#a1a1aa",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {item.category}
      </p>

      <p style={{ margin: "8px 0 0", color: "#ffb347", fontWeight: 950 }}>
        الكمية: {item.qty} | الطلبات: {item.orders}
      </p>

      <p style={{ margin: "6px 0 0", color: "#86efac", fontWeight: 950 }}>
        الإيرادات: {formatMoney(item.revenue)}
      </p>
    </div>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const color =
    item.stockRisk === "عالي"
      ? "#ef4444"
      : item.stockRisk === "متوسط"
      ? "#f59e0b"
      : "#22c55e";

  const percent = Math.min(Math.round((item.qty / 30) * 100), 100);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "white", fontSize: 13, fontWeight: 950 }}>
            {item.name}
          </p>

          <p
            style={{
              margin: "5px 0 0",
              color: "#71717a",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {item.category} • {item.action}
          </p>
        </div>

        <span
          style={{
            border: `1px solid ${color}44`,
            background: `${color}18`,
            color,
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 950,
          }}
        >
          {item.stockRisk}
        </span>
      </div>

      <div
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color}, #ffb347)`,
          }}
        />
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        border: "1px dashed rgba(255,255,255,.12)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 16,
        padding: 16,
        textAlign: "center",
        color: "#71717a",
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}