"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

type Driver = {
  id: string;
  name?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
};

type Order = {
  id: string;
  restaurant?: string;
  status?: string;
  address?: string;
};

export default function SmartCityMapPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "driversStatus"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Driver[];

      setDrivers(data);
    });

    return () => unsub();
  }, []);

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

  const onlineDrivers = drivers.filter(
    (driver) => driver.status === "متصل"
  );

  const readyOrders = orders.filter(
    (order) =>
      order.status === "جاهز" ||
      order.status === "جاهز للتوصيل"
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "تم التسليم" &&
      order.status !== "مرفوض"
  );

  const hotLevel = useMemo(() => {
    if (activeOrders.length >= 20) {
      return {
        title: "ضغط مرتفع",
        color: "text-red-400",
      };
    }

    if (activeOrders.length >= 10) {
      return {
        title: "ضغط متوسط",
        color: "text-yellow-400",
      };
    }

    return {
      title: "الوضع طبيعي",
      color: "text-green-400",
    };
  }, [activeOrders.length]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white p-6"
    >
      <div className="max-w-7xl mx-auto">

        <h1 className="text-center text-6xl font-black text-yellow-400">
          🌍 Smart City Map
        </h1>

        <p className="text-center text-slate-400 mt-3">
          خريطة المدينة الذكية لفيوز
        </p>

        <div className="grid md:grid-cols-4 gap-6 mt-10">

          <Card
            title="السائقون المتصلون"
            value={onlineDrivers.length}
            color="text-green-400"
          />

          <Card
            title="الطلبات النشطة"
            value={activeOrders.length}
            color="text-yellow-400"
          />

          <Card
            title="طلبات جاهزة"
            value={readyOrders.length}
            color="text-blue-400"
          />

          <Card
            title="حالة المدينة"
            value={hotLevel.title}
            color={hotLevel.color}
          />

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-black text-red-400 mb-6">
              🔥 AI Heatmap
            </h2>

            <div className="space-y-4">

              <Heat text="زيونة - ضغط مرتفع" />

              <Heat text="الكرادة - ضغط متوسط" />

              <Heat text="المنصور - طبيعي" />

              <Heat text="الجادرية - طبيعي" />

            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

            <h2 className="text-3xl font-black text-purple-400 mb-6">
              🤖 Smart AI
            </h2>

            <div className="space-y-4">

              <Alert text="🚗 أرسل سائقين إضافيين إلى زيونة." />

              <Alert text="⚡ فعّل سائق احتياط للكرادة." />

              <Alert text="📦 توجد طلبات جاهزة تحتاج توزيع سريع." />

              <Alert text="🟢 المنصور مستقرة حالياً." />

            </div>

          </div>

        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-3xl font-black text-yellow-400">
            🚨 تنبيهات المدينة
          </h2>

          <div className="space-y-4 mt-6">

            <Alert text="ضغط مرتفع بمنطقة زيونة." />

            <Alert text="عدد السائقين أقل من المتوقع." />

            <Alert text="أفضل وقت للتوصيل بين 7 و10 مساءً." />

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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
      <p className="text-slate-400">{title}</p>

      <p className={`text-4xl font-black mt-4 ${color}`}>
        {value}
      </p>
    </div>
  );
}

function Heat({ text }: { text: string }) {
  return (
    <div className="bg-red-500/20 rounded-2xl p-5">
      {text}
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <div className="bg-purple-500/20 rounded-2xl p-5">
      {text}
    </div>
  );
}