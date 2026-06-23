"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  total?: number;
  status?: string;
  customerName?: string;
  items?: {
    name?: string;
    qty?: number;
  }[];
};

type Driver = {
  id: string;
  status?: string;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

export default function CEOCommandCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[]
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      setDrivers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Driver[]
      );
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.status === "تم التسليم"
    );

    const activeOrders = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "")
    );

    const revenue = delivered.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const onlineDrivers = drivers.filter(
      (driver) => driver.status === "متصل"
    ).length;

    const customerMap: Record<string, number> = {};
    orders.forEach((order) => {
      const customer = order.customerName || "غير معروف";
      customerMap[customer] = (customerMap[customer] || 0) + 1;
    });

    const bestCustomer =
      Object.entries(customerMap).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "لا يوجد";

    const productMap: Record<string, number> = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const name = item.name || "غير معروف";
        productMap[name] = (productMap[name] || 0) + Number(item.qty || 1);
      });
    });

    const topProduct =
      Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "لا يوجد";

    return {
      revenue,
      activeOrders: activeOrders.length,
      onlineDrivers,
      bestCustomer,
      topProduct,
    };
  }, [orders, drivers]);

  const aiDecisions = [
    "🧠 زيادة عدد السائقين في وقت الذروة",
    "🔥 التركيز على المنتجات الأعلى مبيعاً",
    "🎁 تشغيل عروض للمنتجات الضعيفة",
    "📈 متابعة نمو الإيرادات يومياً",
  ];

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 28,
        padding: 18,
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
        CEO COMMAND CENTER
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          color: "white",
          fontSize: 28,
          fontWeight: 950,
        }}
      >
        🚀 مركز القيادة العليا
      </h2>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 12,
        }}
      >
        <Card title="الإيرادات" value={formatMoney(data.revenue)} />
        <Card title="الطلبات النشطة" value={data.activeOrders} />
        <Card title="السائقون المتصلون" value={data.onlineDrivers} />
        <Card title="أفضل منتج" value={data.topProduct} />
        <Card title="أفضل زبون" value={data.bestCustomer} />
      </div>

      <div
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,122,0,.20)",
          background: "rgba(255,122,0,.08)",
          borderRadius: 20,
          padding: 16,
        }}
      >
        <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
          🧠 قرارات FUSE AI
        </h3>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {aiDecisions.map((item, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 12,
                color: "#d4d4d8",
                fontWeight: 850,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string | number;
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
        {title}
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#ffb347",
          fontSize: 20,
          fontWeight: 950,
          lineHeight: 1.4,
        }}
      >
        {value}
      </p>
    </div>
  );
}