"use client";

import type { Order } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

export function RevenueAnalyticsPro({ orders }: { orders: Order[] }) {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const delivered = orders
    .filter((order) => order.status === "تم التسليم")
    .reduce((sum, order) => sum + order.amount, 0);

  const active = total - delivered;
  const average = orders.length ? Math.round(total / orders.length) : 0;

  const chartValues = [42, 65, 48, 78, 70, 92, 86];

  return (
    <Card title="Revenue Analytics Pro">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat
          title="إيراد اليوم"
          value={`${total.toLocaleString()} د.ع`}
          color="text-[#FF7A00]"
        />
        <MiniStat
          title="إيراد مؤكد"
          value={`${delivered.toLocaleString()} د.ع`}
          color="text-green-300"
        />
        <MiniStat
          title="قيد التنفيذ"
          value={`${active.toLocaleString()} د.ع`}
          color="text-yellow-300"
        />
        <MiniStat
          title="متوسط الطلب"
          value={`${average.toLocaleString()} د.ع`}
          color="text-white"
        />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {chartValues.map((value, index) => (
          <div
            key={index}
            className="flex h-32 items-end rounded-2xl bg-white/5 p-2"
          >
            <div
              className="w-full rounded-xl bg-[#FF7A00]"
              style={{ height: `${value}%` }}
            />
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🧠 تحليل الإيراد: أعلى حركة حالياً بين الظهر والمساء. فعّل عرض خفيف وقت
        الهبوط حتى تثبت المبيعات.
      </p>
    </Card>
  );
}

