"use client";

import type { MenuItem, Order } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

export function RestaurantReportsCenter({
  orders,
  menu,
}: {
  orders: Order[];
  menu: MenuItem[];
}) {
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;

  const topItem = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];

  return (
    <Card title="Restaurant Reports Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat
          title="مبيعات اليوم"
          value={`${totalSales.toLocaleString()} د.ع`}
          color="text-[#FF7A00]"
        />
        <MiniStat title="طلبات مكتملة" value={delivered} color="text-green-300" />
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="أفضل صنف" value={topItem?.name || "لا يوجد"} color="text-white" />
      </div>
    </Card>
  );
}

