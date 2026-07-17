 "use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Order = {
  id: string;
  total?: number;
  status?: string;
  restaurant?: string;
  driverName?: string;
  address?: string;
  area?: string;
};

type Rating = {
  id: string;
  driverRating?: number;
  restaurantRating?: number;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-IQ")} د.ع`;
}

function getTopValue(items: string[]) {
  if (items.length === 0) return "لا يوجد";

  const counter: Record<string, number> = {};

  items.forEach((item) => {
    if (!item) return;
    counter[item] = (counter[item] || 0) + 1;
  });

  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);

  return sorted[0]?.[0] || "لا يوجد";
}

export default function FuseBrainPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setOrders(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Rating[];

      setRatings(data);
    });

    return () => unsub();
  }, []);

  const activeOrders = orders.filter(
    (order) => order.status !== "تم التسليم" && order.status !== "مرفوض"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  const delayedOrders = orders.filter(
    (order) =>
      order.status === "متأخر" ||
      order.status === "تأخير" ||
      order.status === "late"
  );

  const totalSales = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const avgDriverRating =
    ratings.length === 0
      ? 0
      : ratings.reduce((sum, item) => sum + Number(item.driverRating || 0), 0) /
        ratings.length;

  const avgRestaurantRating =
    ratings.length === 0
      ? 0
      : ratings.reduce(
          (sum, item) => sum + Number(item.restaurantRating || 0),
          0
        ) / ratings.length;

  const avgRating =
    ratings.length === 0 ? 0 : (avgDriverRating + avgRestaurantRating) / 2;

  const topRestaurant = useMemo(() => {
    return getTopValue(
      deliveredOrders
        .map((order) => order.restaurant || "")
        .filter(Boolean)
    );
  }, [deliveredOrders]);

  const topArea = useMemo(() => {
    return getTopValue(
      orders
        .map((order) => order.area || order.address || "")
        .filter(Boolean)
    );
  }, [orders]);

  const platformStatus = useMemo(() => {
    if (activeOrders.length >= 20 || delayedOrders.length >= 5) {
      return {
        title: "ازدحام شديد",
        color: "text-red-400",
        bg: "bg-red-500/15",
        border: "border-red-500/30",
        icon: "🔴",
      };
    }

    if (activeOrders.length >= 10 || delayedOrders.length >= 2) {
      return {
        title: "ازدحام متوسط",
        color: "text-yellow-400",
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
        icon: "🟡",
      };
    }

    return {
      title: "الوضع طبيعي",
      color: "text-green-400",
      bg: "bg-green-500/15",
      border: "border-green-500/30",
      icon: "🟢",
    };
  }, [activeOrders.length, delayedOrders.length]);

  const aiAlerts = useMemo(() => {
    const alerts: string[] = [];

    if (activeOrders.length > 10) {
      alerts.push("🚨 الضغط مرتفع، يفضّل تشغيل سائقين إضافيين فوراً.");
    }

    if (delayedOrders.length > 0) {
      alerts.push(`⚠️ يوجد ${delayedOrders.length} طلب متأخر يحتاج متابعة.`);
    }

    if (avgDriverRating > 0 && avgDriverRating < 3) {
      alerts.push("⚠️ متوسط تقييم السائقين منخفض، راقب أداء الأسطول.");
    }

    if (avgRestaurantRating > 0 && avgRestaurantRating < 3) {
      alerts.push("⚠️ بعض المطاعم تحتاج متابعة بسبب انخفاض التقييم.");
    }

    if (topRestaurant !== "لا يوجد" && deliveredOrders.length >= 3) {
      alerts.push(`🔥 ${topRestaurant} يحقق أعلى نشاط اليوم.`);
    }

    if (alerts.length === 0) {
      alerts.push("✅ جميع المؤشرات ضمن الوضع الطبيعي.");
    }

    return alerts;
  }, [
    activeOrders.length,
    delayedOrders.length,
    avgDriverRating,
    avgRestaurantRating,
    topRestaurant,
    deliveredOrders.length,
  ]);

  const aiSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    if (activeOrders.length >= 10) {
      suggestions.push("🛵 زِد عدد السائقين المتصلين خلال وقت الذروة.");
    }

    if (topArea !== "لا يوجد") {
      suggestions.push(`📍 ركّز التوزيع والعروض على منطقة ${topArea}.`);
    }

    if (topRestaurant !== "لا يوجد") {
      suggestions.push(`🍽️ سوِّ عرض سريع مع ${topRestaurant} لزيادة الطلبات.`);
    }

    if (avgRating >= 4) {
      suggestions.push("⭐ استغل التقييم العالي بحملة تسويقية اليوم.");
    }

    suggestions.push("🚀 أفضل وقت لتشغيل العروض غالباً بين 7 و 10 مساءً.");

    return suggestions;
  }, [activeOrders.length, topArea, topRestaurant, avgRating]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-yellow-400">
            🧠 Fuse Brain AI
          </h1>

          <p className="text-slate-400 mt-3 text-lg">
            العقل المركزي لفيوز وتحليل المنصة لحظياً
          </p>
        </div>

        <div
          className={`mt-10 rounded-3xl border ${platformStatus.border} ${platformStatus.bg} p-6 shadow-2xl`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className={`text-4xl font-black ${platformStatus.color}`}>
                {platformStatus.icon} حالة المنصة: {platformStatus.title}
              </h2>

              <p className="text-slate-300 mt-3">
                يتم تحديد الحالة حسب عدد الطلبات النشطة والمتأخرة.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-center">
              <p className="text-slate-400">طلبات نشطة الآن</p>
              <p className="text-4xl font-black text-yellow-400 mt-2">
                {activeOrders.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          <Card title="الطلبات النشطة" value={activeOrders.length} color="text-yellow-400" />
          <Card title="الطلبات المسلّمة" value={deliveredOrders.length} color="text-green-400" />
          <Card title="المبيعات" value={formatMoney(totalSales)} color="text-blue-400" />
          <Card title="متوسط التقييم" value={avgRating.toFixed(1)} color="text-purple-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card title="الطلبات المتأخرة" value={delayedOrders.length} color="text-red-400" />
          <Card title="أعلى مطعم" value={topRestaurant} color="text-orange-400" />
          <Card title="أكثر منطقة" value={topArea} color="text-cyan-400" />
          <Card title="عدد التقييمات" value={ratings.length} color="text-pink-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">

          <Section title="🚨 تنبيهات Fuse Brain" color="text-red-400">
            {aiAlerts.map((alert, index) => (
              <div
                key={index}
                className="bg-red-500/15 border border-red-500/30 rounded-2xl p-5 text-lg text-slate-100"
              >
                {alert}
              </div>
            ))}
          </Section>

          <Section title="🤖 اقتراحات الذكاء الاصطناعي" color="text-purple-400">
            {aiSuggestions.map((item, index) => (
              <div
                key={index}
                className="bg-purple-500/15 border border-purple-500/30 rounded-2xl p-5 text-lg text-slate-100"
              >
                {item}
              </div>
            ))}
          </Section>

        </div>

        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-3xl font-black text-yellow-400">
            📈 Performance Center
          </h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <MiniCard label="أعلى مطعم مبيعاً" value={topRestaurant} />
            <MiniCard label="أكثر منطقة طلباً" value={topArea} />
            <MiniCard label="رضا العملاء" value={`${avgRating.toFixed(1)} / 5`} />
            <MiniCard label="إجمالي الطلبات" value={orders.length} />
            <MiniCard label="طلبات غير مكتملة" value={activeOrders.length} />
            <MiniCard label="طلبات تحتاج تدخل" value={delayedOrders.length} />
          </div>
        </div>

      </div>
    </main>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
      <h2 className="text-lg font-bold text-slate-400">{title}</h2>
      <p className={`text-4xl font-black mt-5 ${color}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
      <h2 className={`text-3xl font-black mb-6 ${color}`}>{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400">{label}</p>
      <p className="text-2xl font-black mt-3 text-white">{value}</p>
    </div>
  );
}