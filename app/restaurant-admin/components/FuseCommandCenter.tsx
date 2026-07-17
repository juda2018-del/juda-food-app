 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type OrderItem = {
  name?: string;
  price?: number;
  qty?: number;
};

type Order = {
  id: string;
  customerName?: string;
  phone?: string;
  restaurant?: string;
  status?: string;
  total?: number;
  address?: string;
  driverName?: string;
  createdAt?: any;
  items?: OrderItem[];
};

type Driver = {
  id: string;
  name?: string;
  status?: string;
  lastSeen?: number;
};

const restaurantName = "فيروز";

function isOnline(driver: Driver) {
  if (driver.status !== "متصل") return false;
  if (!driver.lastSeen) return true;
  return Date.now() - driver.lastSeen < 1000 * 60 * 3;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function getTime(createdAt: any) {
  if (!createdAt) return "قبل قليل";

  const date =
    typeof createdAt?.toDate === "function"
      ? createdAt.toDate()
      : new Date(createdAt);

  if (isNaN(date.getTime())) return "قبل قليل";

  return date.toLocaleString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FuseCommandCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status || "جديد")
    );

    const newOrders = orders.filter(
      (order) => (order.status || "جديد") === "جديد"
    );

    const preparingOrders = orders.filter(
      (order) => order.status === "قيد التحضير"
    );

    const readyOrders = orders.filter(
      (order) => order.status === "جاهز للتوصيل"
    );

    const deliveringOrders = orders.filter(
      (order) => order.status === "قيد التوصيل"
    );

    const deliveredOrders = orders.filter(
      (order) => order.status === "تم التسليم"
    );

    const rejectedOrders = orders.filter((order) => order.status === "مرفوض");

    const revenue = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const onlineDrivers = drivers.filter((driver) => isOnline(driver));

    const productMap: Record<string, number> = {};
    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        const name = item.name || "غير محدد";
        const qty = Number(item.qty || 1);
        productMap[name] = (productMap[name] || 0) + qty;
      });
    });

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const topProduct = topProducts[0]?.[0] || "لا توجد بيانات";

    const completionRate =
      orders.length > 0
        ? Math.round((deliveredOrders.length / orders.length) * 100)
        : 0;

    const averageOrder =
      deliveredOrders.length > 0 ? Math.round(revenue / deliveredOrders.length) : 0;

    const pressure =
      activeOrders.length >= 18 || newOrders.length >= 10
        ? "ضغط عالي"
        : activeOrders.length >= 10 || newOrders.length >= 5
        ? "نشط"
        : "مستقر";

    const alerts: string[] = [];

    if (activeOrders.length > 10) alerts.push("🔥 ضغط عالي على الطلبات النشطة");
    if (newOrders.length > 5) alerts.push("⚠️ توجد طلبات جديدة تحتاج قبول سريع");
    if (readyOrders.length > 3) alerts.push("🛵 طلبات جاهزة تحتاج إسناد للسائقين");
    if (onlineDrivers.length < 2) alerts.push("⚠️ عدد السائقين المتاحين منخفض");
    if (preparingOrders.length > 6) alerts.push("👨‍🍳 ضغط واضح داخل المطبخ");
    if (topProduct !== "لا توجد بيانات")
      alerts.push(`🍽️ ${topProduct} هو المنتج الأقوى حالياً`);
    if (deliveredOrders.length > 0) alerts.push("✅ توجد طلبات مسلّمة بنجاح");

    const aiActions: string[] = [];

    if (onlineDrivers.length < 2) aiActions.push("تشغيل سائقين إضافيين للمنطقة");
    if (activeOrders.length > 10) aiActions.push("تسريع تجهيز الطلبات الجديدة");
    if (readyOrders.length > 0) aiActions.push("إسناد الطلبات الجاهزة تلقائياً");
    if (topProduct !== "لا توجد بيانات") aiActions.push(`زيادة مخزون ${topProduct}`);
    if (rejectedOrders.length > 0) aiActions.push("مراجعة أسباب الطلبات المرفوضة");
    aiActions.push("متابعة الطلبات غير المسلّمة كل 5 دقائق");

    const activity = orders.slice(0, 8).map((order) => ({
      title: order.customerName || "زبون جديد",
      status: order.status || "جديد",
      time: getTime(order.createdAt),
      value: formatMoney(Number(order.total || 0)),
      driver: order.driverName || "بدون سائق",
    }));

    return {
      activeOrders: activeOrders.length,
      newOrders: newOrders.length,
      preparingOrders: preparingOrders.length,
      readyOrders: readyOrders.length,
      deliveringOrders: deliveringOrders.length,
      deliveredOrders: deliveredOrders.length,
      rejectedOrders: rejectedOrders.length,
      onlineDrivers: onlineDrivers.length,
      revenue,
      averageOrder,
      topProduct,
      topProducts,
      completionRate,
      pressure,
      alerts,
      aiActions,
      activity,
    };
  }, [orders, drivers]);

  const systemStatus = [
    {
      title: "الطلبات النشطة",
      value: data.activeOrders,
      icon: "📦",
      color: "#ffb347",
      note: `${data.newOrders} جديد / ${data.preparingOrders} تحضير`,
    },
    {
      title: "السائقون المتصلون",
      value: data.onlineDrivers,
      icon: "🛵",
      color: "#86efac",
      note: "متاحين للتوزيع",
    },
    {
      title: "إجمالي الإيرادات",
      value: formatMoney(data.revenue),
      icon: "💰",
      color: "#facc15",
      note: `متوسط الطلب ${formatMoney(data.averageOrder)}`,
    },
    {
      title: "أفضل منتج",
      value: data.topProduct,
      icon: "🏆",
      color: "#93c5fd",
      note: "حسب الكمية المطلوبة",
    },
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
        boxShadow: "0 18px 50px rgba(0,0,0,.30)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "start",
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
            FUSE COMMAND CENTER
          </p>

          <h2
            style={{
              margin: "8px 0 0",
              color: "white",
              fontSize: 28,
              fontWeight: 950,
            }}
          >
            🚀 مركز قيادة FUSE
          </h2>

          <p
            style={{
              marginTop: 8,
              color: "#a1a1aa",
              fontWeight: 800,
            }}
          >
            مراقبة حية للطلبات، السائقين، الإيرادات، النشاطات، والتنبيهات الذكية.
          </p>
        </div>

        <div
          style={{
            minWidth: 180,
            border: "1px solid rgba(255,122,0,.28)",
            background: "rgba(255,122,0,.09)",
            borderRadius: 18,
            padding: 14,
          }}
        >
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
            حالة التشغيل
          </p>

          <h3
            style={{
              margin: "7px 0 0",
              color:
                data.pressure === "ضغط عالي"
                  ? "#ef4444"
                  : data.pressure === "نشط"
                  ? "#ffb347"
                  : "#22c55e",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            {data.pressure}
          </h3>

          <p style={{ margin: "6px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
            نسبة الإنجاز {data.completionRate}%
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
        }}
      >
        {systemStatus.map((item) => (
          <StatusCard key={item.title} {...item} />
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.1fr .9fr",
          gap: 18,
        }}
      >
        <ActivityFeed items={data.activity} />

        <QuickActions
          readyOrders={data.readyOrders}
          newOrders={data.newOrders}
          onlineDrivers={data.onlineDrivers}
          pressure={data.pressure}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <Panel title="🚨 التنبيهات المباشرة" items={data.alerts} />
        <Panel title="🧠 قرارات FUSE AI" items={data.aiActions} />
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <TopProducts products={data.topProducts} />
        <OperationsPulse
          completionRate={data.completionRate}
          activeOrders={data.activeOrders}
          deliveredOrders={data.deliveredOrders}
          rejectedOrders={data.rejectedOrders}
        />
      </div>
    </section>
  );
}

function StatusCard({
  title,
  value,
  icon,
  color,
  note,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  note: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 20,
        padding: 18,
        minHeight: 126,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#d4d4d8",
          fontWeight: 850,
          fontSize: 12,
        }}
      >
        {icon} {title}
      </p>

      <h3
        style={{
          margin: "14px 0 0",
          color,
          fontSize: 22,
          fontWeight: 950,
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}
      >
        {value}
      </h3>

      <p style={{ margin: "8px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
        {note}
      </p>
    </div>
  );
}

function ActivityFeed({
  items,
}: {
  items: {
    title: string;
    status: string;
    time: string;
    value: string;
    driver: string;
  }[];
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.09)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 22,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
        🛰️ النشاطات المباشرة
      </h3>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {items.length === 0 ? (
          <Empty text="لا توجد نشاطات حالياً" />
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.035)",
                borderRadius: 16,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  {item.title}
                </p>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#a1a1aa",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {item.status} • {item.driver}
                </p>
              </div>

              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, color: "#ffb347", fontSize: 12, fontWeight: 950 }}>
                  {item.value}
                </p>

                <p style={{ margin: "5px 0 0", color: "#71717a", fontSize: 10, fontWeight: 800 }}>
                  {item.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickActions({
  readyOrders,
  newOrders,
  onlineDrivers,
  pressure,
}: {
  readyOrders: number;
  newOrders: number;
  onlineDrivers: number;
  pressure: string;
}) {
  const actions = [
    {
      title: "قبول الطلبات الجديدة",
      note: `${newOrders} طلب ينتظر القرار`,
      icon: "✅",
      hot: newOrders > 0,
    },
    {
      title: "إسناد الطلبات الجاهزة",
      note: `${readyOrders} طلب جاهز للتوصيل`,
      icon: "🛵",
      hot: readyOrders > 0,
    },
    {
      title: "استدعاء سائقين",
      note: onlineDrivers < 2 ? "السائقين قليلين" : "الوضع مستقر",
      icon: "📣",
      hot: onlineDrivers < 2,
    },
    {
      title: "تشغيل وضع الضغط",
      note: pressure === "ضغط عالي" ? "مستحسن الآن" : "غير ضروري",
      icon: "🔥",
      hot: pressure === "ضغط عالي",
    },
  ];

  return (
    <div
      style={{
        border: "1px solid rgba(255,122,0,.18)",
        background: "rgba(255,122,0,.07)",
        borderRadius: 22,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
        ⚡ إجراءات سريعة
      </h3>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {actions.map((action) => (
          <div
            key={action.title}
            style={{
              border: action.hot
                ? "1px solid rgba(255,122,0,.38)"
                : "1px solid rgba(255,255,255,.08)",
              background: action.hot
                ? "rgba(255,122,0,.12)"
                : "rgba(0,0,0,.22)",
              borderRadius: 16,
              padding: 12,
            }}
          >
            <p style={{ margin: 0, color: "white", fontSize: 12, fontWeight: 950 }}>
              {action.icon} {action.title}
            </p>

            <p style={{ margin: "7px 0 0", color: "#a1a1aa", fontSize: 10, fontWeight: 800 }}>
              {action.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,122,0,.20)",
        background: "rgba(255,122,0,.08)",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "white",
          fontWeight: 950,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 10,
        }}
      >
        {items.length === 0 ? (
          <Empty text="لا توجد تنبيهات حالياً" />
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0,0,0,.22)",
                borderRadius: 14,
                padding: 14,
                color: "#d4d4d8",
                fontWeight: 850,
                fontSize: 12,
              }}
            >
              • {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopProducts({ products }: { products: [string, number][] }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.09)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 22,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
        🏆 أقوى المنتجات الآن
      </h3>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        {products.length === 0 ? (
          <Empty text="لا توجد بيانات منتجات" />
        ) : (
          products.map(([name, qty], index) => (
            <div
              key={name}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.035)",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: index === 0 ? "#ff7a00" : "rgba(255,255,255,.08)",
                  color: index === 0 ? "#111" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                }}
              >
                {index + 1}
              </span>

              <p style={{ margin: 0, color: "white", fontSize: 12, fontWeight: 950 }}>
                {name}
              </p>

              <p style={{ margin: 0, color: "#ffb347", fontSize: 12, fontWeight: 950 }}>
                {qty} طلب
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OperationsPulse({
  completionRate,
  activeOrders,
  deliveredOrders,
  rejectedOrders,
}: {
  completionRate: number;
  activeOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
}) {
  const loadPercent = Math.min(Math.round((activeOrders / 20) * 100), 100);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.09)",
        background: "rgba(0,0,0,.22)",
        borderRadius: 22,
        padding: 16,
      }}
    >
      <h3 style={{ margin: 0, color: "white", fontWeight: 950 }}>
        📡 نبض التشغيل
      </h3>

      <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
        <Pulse title="نسبة الإنجاز" value={`${completionRate}%`} percent={completionRate} />
        <Pulse title="ضغط التشغيل" value={`${loadPercent}%`} percent={loadPercent} />
        <Pulse
          title="الطلبات المسلّمة"
          value={`${deliveredOrders} طلب`}
          percent={Math.min(deliveredOrders * 8, 100)}
        />
        <Pulse
          title="الطلبات المرفوضة"
          value={`${rejectedOrders} طلب`}
          percent={Math.min(rejectedOrders * 10, 100)}
        />
      </div>
    </div>
  );
}

function Pulse({
  title,
  value,
  percent,
}: {
  title: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 11, fontWeight: 900 }}>
          {title}
        </p>

        <p style={{ margin: 0, color: "#ffb347", fontSize: 11, fontWeight: 950 }}>
          {value}
        </p>
      </div>

      <div
        style={{
          marginTop: 8,
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
            background: "linear-gradient(90deg, #ff7a00, #ffb347)",
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
        background: "rgba(0,0,0,.22)",
        borderRadius: 14,
        padding: 14,
        color: "#d4d4d8",
        fontWeight: 850,
        fontSize: 12,
      }}
    >
      {text}
    </div>
  );
}