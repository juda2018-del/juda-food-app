 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  customerName?: string;
  phone?: string;
  total?: number;
  status?: string;
  createdAt?: any;
};

type CustomerStats = {
  key: string;
  name: string;
  phone: string;
  orders: number;
  delivered: number;
  rejected: number;
  active: number;
  spent: number;
  avgOrder: number;
  loyalty: "VIP" | "متكرر" | "جديد" | "خطر";
  lastOrder: string;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function getDate(createdAt: any) {
  if (!createdAt) return null;

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return null;
  return date;
}

function formatLastOrder(createdAt: any) {
  const date = getDate(createdAt);
  if (!date) return "غير معروف";

  return date.toLocaleString("ar-IQ", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerInsightsCenter() {
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

  const data = useMemo(() => {
    const map: Record<string, CustomerStats & { lastRaw?: any }> = {};

    orders.forEach((order) => {
      const phone = order.phone || "بدون رقم";
      const name = order.customerName || "زبون";
      const key = phone !== "بدون رقم" ? phone : name;

      if (!map[key]) {
        map[key] = {
          key,
          name,
          phone,
          orders: 0,
          delivered: 0,
          rejected: 0,
          active: 0,
          spent: 0,
          avgOrder: 0,
          loyalty: "جديد",
          lastOrder: "غير معروف",
          lastRaw: order.createdAt,
        };
      }

      map[key].orders += 1;

      if (!["تم التسليم", "مرفوض"].includes(order.status || "جديد")) {
        map[key].active += 1;
      }

      if (order.status === "تم التسليم") {
        map[key].delivered += 1;
        map[key].spent += Number(order.total || 0);
      }

      if (order.status === "مرفوض") {
        map[key].rejected += 1;
      }

      const currentDate = getDate(order.createdAt)?.getTime() || 0;
      const savedDate = getDate(map[key].lastRaw)?.getTime() || 0;

      if (currentDate >= savedDate) {
        map[key].lastRaw = order.createdAt;
        map[key].lastOrder = formatLastOrder(order.createdAt);
      }
    });

    const customers = Object.values(map)
      .map((customer) => {
        const avgOrder =
          customer.delivered > 0 ? Math.round(customer.spent / customer.delivered) : 0;

        let loyalty: CustomerStats["loyalty"] = "جديد";

        if (customer.rejected >= 2 && customer.delivered === 0) {
          loyalty = "خطر";
        } else if (customer.spent >= 100000 || customer.delivered >= 6) {
          loyalty = "VIP";
        } else if (customer.orders >= 3) {
          loyalty = "متكرر";
        }

        return {
          ...customer,
          avgOrder,
          loyalty,
        };
      })
      .sort((a, b) => b.spent - a.spent);

    const topCustomers = customers.slice(0, 10);
    const vipCustomers = customers.filter((c) => c.loyalty === "VIP").length;
    const repeatCustomers = customers.filter((c) => c.loyalty === "متكرر").length;
    const riskCustomers = customers.filter((c) => c.loyalty === "خطر").length;
    const totalSpent = customers.reduce((sum, c) => sum + c.spent, 0);
    const avgCustomerValue =
      customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;

    const recommendations: string[] = [];

    if (vipCustomers > 0) {
      recommendations.push("👑 فعّل عرض خاص للزبائن VIP للحفاظ عليهم");
    }

    if (repeatCustomers > 0) {
      recommendations.push("🔁 الزبائن المتكررون فرصة ممتازة لبرنامج نقاط");
    }

    if (riskCustomers > 0) {
      recommendations.push("⚠️ راجع الزبائن ذوي الطلبات المرفوضة");
    }

    if (customers.length < 5) {
      recommendations.push("📣 تحتاج حملات لجذب زبائن جدد");
    }

    if (avgCustomerValue > 25000) {
      recommendations.push("💰 متوسط إنفاق الزبون قوي، ركز على الوجبات الأعلى سعراً");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ سلوك الزبائن مستقر حالياً");
    }

    return {
      customers,
      topCustomers,
      vipCustomers,
      repeatCustomers,
      riskCustomers,
      totalSpent,
      avgCustomerValue,
      recommendations,
    };
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
        CUSTOMER INSIGHTS
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          color: "white",
          fontSize: 26,
          fontWeight: 950,
        }}
      >
        👥 مركز الزبائن
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        تحليل الزبائن حسب التكرار، الإنفاق، الولاء، آخر طلب، وحالة المخاطر.
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        <Card title="عدد الزبائن" value={data.customers.length} icon="👥" />
        <Card title="VIP" value={data.vipCustomers} icon="👑" />
        <Card title="متوسط الزبون" value={formatMoney(data.avgCustomerValue)} icon="💰" />
        <Card title="زبائن خطر" value={data.riskCustomers} icon="⚠️" />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.25fr .75fr",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {data.topCustomers.length === 0 ? (
            <Empty text="لا توجد بيانات زبائن حالياً" />
          ) : (
            data.topCustomers.map((customer, index) => (
              <CustomerRow key={customer.key} customer={customer} index={index} />
            ))
          )}
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
            🧠 توصيات الزبائن
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {data.recommendations.map((item, index) => (
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
                {item}
              </div>
            ))}
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

function CustomerRow({
  customer,
  index,
}: {
  customer: CustomerStats;
  index: number;
}) {
  const loyaltyColor =
    customer.loyalty === "VIP"
      ? "#facc15"
      : customer.loyalty === "متكرر"
      ? "#86efac"
      : customer.loyalty === "خطر"
      ? "#fca5a5"
      : "#93c5fd";

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background:
          customer.loyalty === "VIP"
            ? "rgba(255,122,0,.10)"
            : "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 16,
        display: "grid",
        gridTemplateColumns: "1.4fr repeat(5, .8fr)",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: "white",
            fontSize: 16,
            fontWeight: 950,
          }}
        >
          #{index + 1} 👤 {customer.name}
        </h3>

        <p
          style={{
            margin: "6px 0 0",
            color: "#71717a",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {customer.phone}
        </p>

        <span
          style={{
            display: "inline-block",
            marginTop: 8,
            border: `1px solid ${loyaltyColor}44`,
            background: `${loyaltyColor}16`,
            color: loyaltyColor,
            borderRadius: 999,
            padding: "5px 9px",
            fontSize: 10,
            fontWeight: 950,
          }}
        >
          {customer.loyalty}
        </span>
      </div>

      <Mini title="كل الطلبات" value={customer.orders} color="#ffb347" />
      <Mini title="مسلمة" value={customer.delivered} color="#86efac" />
      <Mini title="نشطة" value={customer.active} color="#93c5fd" />
      <Mini title="متوسط" value={formatMoney(customer.avgOrder)} color="#facc15" />
      <Mini title="آخر طلب" value={customer.lastOrder} color="#d4d4d8" />
    </div>
  );
}

function Mini({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div>
      <p style={{ margin: 0, color: "#a1a1aa", fontWeight: 800, fontSize: 11 }}>
        {title}
      </p>

      <p
        style={{
          marginTop: 6,
          color,
          fontSize: 14,
          fontWeight: 950,
          lineHeight: 1.45,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
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
      {text}
    </div>
  );
}