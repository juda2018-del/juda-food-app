 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type Order = {
  id: string;
  restaurant?: string;
  total?: number;
  status?: string;
  customerName?: string;
  driverName?: string;
  address?: string;
  items?: {
    name?: string;
    qty?: number;
    price?: number;
  }[];
};

type Driver = {
  id: string;
  name?: string;
  status?: string;
  lastSeen?: number;
};

const restaurantName = "فيروز";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

export default function FuseCopilotCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("اسألني عن الطلبات، الإيرادات، السائقين، المنتجات أو أداء المطعم.");

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
    const delivered = orders.filter((order) => order.status === "تم التسليم");
    const active = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "جديد")
    );
    const newOrders = orders.filter((order) => (order.status || "جديد") === "جديد");
    const ready = orders.filter((order) => order.status === "جاهز للتوصيل");
    const rejected = orders.filter((order) => order.status === "مرفوض");

    const revenue = delivered.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const onlineDrivers = drivers.filter((driver) => isOnline(driver));

    const productMap: Record<string, number> = {};
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const name = item.name || "غير معروف";
        productMap[name] = (productMap[name] || 0) + Number(item.qty || 1);
      });
    });

    const topProduct =
      Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "لا توجد بيانات";

    const avgOrder =
      delivered.length > 0 ? Math.round(revenue / delivered.length) : 0;

    const health =
      active.length >= 15 || onlineDrivers.length < 1
        ? "يحتاج تدخل"
        : active.length >= 8 || onlineDrivers.length < 2
        ? "تحت الضغط"
        : "مستقر";

    const recommendations: string[] = [];

    if (newOrders.length > 5) recommendations.push("قبول الطلبات الجديدة بسرعة.");
    if (ready.length > 2) recommendations.push("إسناد الطلبات الجاهزة للسائقين.");
    if (onlineDrivers.length < 2) recommendations.push("تشغيل سائقين إضافيين.");
    if (topProduct !== "لا توجد بيانات") recommendations.push(`زيادة تجهيز ${topProduct}.`);
    if (rejected.length > 0) recommendations.push("مراجعة الطلبات المرفوضة.");
    if (recommendations.length === 0) recommendations.push("الوضع مستقر، استمر بنفس الأداء.");

    return {
      totalOrders: orders.length,
      activeOrders: active.length,
      newOrders: newOrders.length,
      readyOrders: ready.length,
      rejectedOrders: rejected.length,
      deliveredOrders: delivered.length,
      revenue,
      avgOrder,
      onlineDrivers: onlineDrivers.length,
      topProduct,
      health,
      recommendations,
    };
  }, [orders, drivers]);

  function askCopilot() {
    const q = question.trim();

    if (!q) {
      setAnswer("اكتب سؤالك أولاً، مثلاً: شنو وضع المطعم؟ أو شكد الإيرادات؟");
      return;
    }

    if (q.includes("ايراد") || q.includes("إيراد") || q.includes("مبيعات")) {
      setAnswer(
        `إيرادات الطلبات المسلّمة حالياً هي ${formatMoney(
          data.revenue
        )}. متوسط الطلب الواحد تقريباً ${formatMoney(data.avgOrder)}.`
      );
      return;
    }

    if (q.includes("سائق") || q.includes("توصيل")) {
      setAnswer(
        `عندك ${data.onlineDrivers} سائق متصل، و ${data.readyOrders} طلب جاهز للتوصيل. ${
          data.onlineDrivers < 2 ? "الأفضل تشغل سائقين إضافيين." : "وضع السائقين جيد حالياً."
        }`
      );
      return;
    }

    if (q.includes("طلب") || q.includes("طلبات")) {
      setAnswer(
        `إجمالي الطلبات ${data.totalOrders}. الطلبات النشطة ${data.activeOrders}. الطلبات الجديدة ${data.newOrders}. الطلبات المسلّمة ${data.deliveredOrders}.`
      );
      return;
    }

    if (q.includes("منتج") || q.includes("منيو") || q.includes("اكل")) {
      setAnswer(
        `أفضل منتج حالياً هو: ${data.topProduct}. أنصح تتابع توفره بالمخزون وتخلي عليه عرض ذكي إذا الطلب مستمر.`
      );
      return;
    }

    if (q.includes("وضع") || q.includes("حالة") || q.includes("ضغط")) {
      setAnswer(
        `حالة التشغيل الآن: ${data.health}. أهم توصية: ${data.recommendations[0]}`
      );
      return;
    }

    setAnswer(
      `حسب بيانات المطعم الآن: الحالة ${data.health}، الطلبات النشطة ${data.activeOrders}، الإيرادات ${formatMoney(
        data.revenue
      )}، وأفضل إجراء هو: ${data.recommendations[0]}`
    );
  }

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,.10)",
        background:
          "linear-gradient(135deg, rgba(17,16,14,.98), rgba(7,6,5,.98))",
        borderRadius: 28,
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
        FUSE COPILOT
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          color: "white",
          fontSize: 28,
          fontWeight: 950,
        }}
      >
        🤖 مساعد FUSE للمطعم
      </h2>

      <p style={{ marginTop: 8, color: "#a1a1aa", fontWeight: 800 }}>
        اسأل عن الطلبات، الإيرادات، السائقين، المنتجات، الضغط، والتوصيات التشغيلية.
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        <Card title="حالة التشغيل" value={data.health} icon="📡" />
        <Card title="طلبات نشطة" value={data.activeOrders} icon="📦" />
        <Card title="سائقين متصلين" value={data.onlineDrivers} icon="🛵" />
        <Card title="الإيرادات" value={formatMoney(data.revenue)} icon="💰" />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.1fr .9fr",
          gap: 14,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,122,0,.22)",
            background: "rgba(255,122,0,.08)",
            borderRadius: 22,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            💬 اسأل Copilot
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askCopilot();
              }}
              placeholder="مثال: شنو وضع الطلبات؟ شكد الإيرادات؟ منو أفضل منتج؟"
              style={{
                height: 48,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(0,0,0,.35)",
                color: "white",
                padding: "0 14px",
                outline: "none",
                fontWeight: 900,
              }}
            />

            <button
              onClick={askCopilot}
              style={{
                height: 46,
                borderRadius: 16,
                border: "1px solid rgba(255,122,0,.35)",
                background: "linear-gradient(135deg, #ff7a00, #ffb347)",
                color: "#111",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              اسأل المساعد
            </button>

            <div
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(0,0,0,.28)",
                borderRadius: 18,
                padding: 16,
                color: "#d4d4d8",
                fontWeight: 850,
                lineHeight: 1.8,
                minHeight: 110,
              }}
            >
              {answer}
            </div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.22)",
            borderRadius: 22,
            padding: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
            🧠 أسئلة جاهزة
          </h3>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {[
              "شنو وضع المطعم؟",
              "شكد الإيرادات؟",
              "شنو وضع السائقين؟",
              "منو أفضل منتج؟",
              "شنو الإجراء الأفضل هسة؟",
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setQuestion(item);
                  setTimeout(() => askCopilot(), 50);
                }}
                style={{
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(255,255,255,.035)",
                  color: "white",
                  borderRadius: 14,
                  padding: 12,
                  textAlign: "right",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
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
          fontSize: 20,
          fontWeight: 950,
          lineHeight: 1.4,
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}