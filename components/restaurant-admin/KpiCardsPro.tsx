"use client";

import type { Order, Settings } from "@/lib/types";

export function KpiCardsPro({
  orders,
  totalSales,
  settings,
}: {
  orders: Order[];
  totalSales: number;
  settings: Settings;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;

  const newOrders = orders.filter((order) => order.status === "جديد").length;
  const preparingOrders = orders.filter(
    (order) => order.status === "قيد التحضير"
  ).length;
  const readyOrders = orders.filter((order) => order.status === "جاهز").length;
  const deliveringOrders = orders.filter(
    (order) => order.status === "قيد التوصيل"
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;

  const completionRate =
    orders.length > 0 ? Math.round((deliveredOrders / orders.length) * 100) : 0;

  const averageOrder =
    orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  const pressureScore = preparingOrders + readyOrders + urgentOrders;
  const pressure =
    pressureScore >= 4 ? "ضغط عالي" : pressureScore >= 2 ? "ضغط متوسط" : "مستقر";

  const pressureColor =
    pressure === "ضغط عالي"
      ? "text-red-300"
      : pressure === "ضغط متوسط"
      ? "text-yellow-300"
      : "text-green-300";

  const cards = [
    {
      title: "طلبات نشطة",
      value: activeOrders,
      hint: `جديدة: ${newOrders}`,
      color: "text-yellow-300",
      border: "border-yellow-500/20 bg-yellow-500/10",
    },
    {
      title: "الإيرادات",
      value: `${totalSales.toLocaleString()} د.ع`,
      hint: `متوسط: ${averageOrder.toLocaleString()} د.ع`,
      color: "text-[#FF7A00]",
      border: "border-[#FF7A00]/25 bg-[#FF7A00]/10",
    },
    {
      title: "طلبات عاجلة",
      value: urgentOrders,
      hint: "تحتاج متابعة",
      color: "text-red-300",
      border: "border-red-500/20 bg-red-500/10",
    },
    {
      title: "جاهزة للتوصيل",
      value: readyOrders,
      hint: `بالتوصيل: ${deliveringOrders}`,
      color: "text-sky-300",
      border: "border-sky-500/20 bg-sky-500/10",
    },
    {
      title: "تم التسليم",
      value: deliveredOrders,
      hint: `هدف التحضير: ${settings.prepTime} د`,
      color: "text-green-300",
      border: "border-green-500/20 bg-green-500/10",
    },
    {
      title: "ضغط المطبخ",
      value: pressure,
      hint: `نسبة الإنجاز ${completionRate}%`,
      color: pressureColor,
      border: "border-white/10 bg-white/5",
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B0B0B] p-5 shadow-[0_0_35px_rgba(255,122,0,0.06)]">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black">KPI Cards Pro</h2>
          <p className="mt-1 text-sm text-white/45">
            مؤشرات تشغيل فورية للمطعم — طلبات، إيراد، ضغط، إنجاز
          </p>
        </div>

        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Prep Target: {settings.prepTime} د
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-3xl border p-5 ${card.border}`}
          >
            <p className="text-sm text-white/50">{card.title}</p>
            <h3 className={`mt-2 text-2xl font-black ${card.color}`}>
              {card.value}
            </h3>
            <p className="mt-2 text-xs text-white/40">{card.hint}</p>

            {card.title === "ضغط المطبخ" && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FF7A00]"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

