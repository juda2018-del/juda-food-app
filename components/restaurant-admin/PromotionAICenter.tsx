"use client";

import type { MenuItem, Order } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

export function PromotionAICenter({
  menu,
  updateMenu,
  orders,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
  orders: Order[];
}) {
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <Card title="Promotion AI Center">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat
          title="عروض فعالة"
          value={menu.filter((item) => item.discount > 0).length}
          color="text-[#FF7A00]"
        />
        <MiniStat
          title="مرشحة للعروض"
          value={menu.filter((item) => !item.outOfStock).length}
          color="text-green-300"
        />
        <MiniStat
          title="ممنوعة بسبب النفاد"
          value={menu.filter((item) => item.outOfStock).length}
          color="text-red-300"
        />
        <MiniStat
          title="زيادة متوقعة"
          value={`${Math.round(totalSales * 0.14).toLocaleString()} د.ع`}
          color="text-yellow-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menu.map((item) => {
          const discount = item.ordersToday >= 30 ? 5 : item.ordersToday >= 18 ? 10 : 15;

          return (
            <div key={item.id} className="rounded-3xl bg-white/5 p-4">
              <p className="font-black">{item.name}</p>
              <p className="mt-2 text-xs text-white/45">
                خصم مقترح: {discount}%
              </p>

              <button
                disabled={item.outOfStock}
                onClick={() => updateMenu(item.id, { discount })}
                className={`mt-3 w-full rounded-2xl p-3 text-sm font-bold ${
                  item.outOfStock
                    ? "bg-white/10 text-white/30"
                    : "bg-[#FF7A00] text-black"
                }`}
              >
                تطبيق العرض
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

