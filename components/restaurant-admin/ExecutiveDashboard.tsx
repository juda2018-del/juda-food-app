"use client";

import type { Order, Settings } from "@/lib/types";

export function ExecutiveDashboard({
  totalSales,
  restaurantOpen,
  settings,
  orders,
}: {
  totalSales: number;
  restaurantOpen: boolean;
  settings: Settings;
  orders: Order[];
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;

  const urgent = orders.filter((order) => order.priority === "عاجل").length;

  const stats = [
    ["طلبات اليوم", orders.length, `${activeOrders} طلب نشط`, "text-white"],
    [
      "مبيعات اليوم",
      `${totalSales.toLocaleString()} د.ع`,
      "محدث مباشر",
      "text-[#FF7A00]",
    ],
    [
      "متوسط التحضير",
      `${settings.prepTime} د`,
      urgent ? `${urgent} عاجل` : "مستقر",
      "text-yellow-300",
    ],
    [
      "حالة المطعم",
      restaurantOpen ? settings.mode : "مغلق",
      "تحكم فوري",
      restaurantOpen ? "text-green-300" : "text-red-300",
    ],
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {stats.map(([title, value, hint, color]) => (
        <div
          key={title}
          className="rounded-3xl border border-white/10 bg-[#0B0B0B] p-5"
        >
          <p className="text-sm text-white/50">{title}</p>
          <h3 className={`mt-2 text-2xl font-black ${color}`}>{value}</h3>
          <p className="mt-2 text-xs text-white/40">{hint}</p>
        </div>
      ))}
    </div>
  );
}

