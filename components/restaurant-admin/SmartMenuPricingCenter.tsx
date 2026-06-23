"use client";

import type { MenuItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";

function getSuggestedPrice(item: MenuItem) {
  if (item.outOfStock) return item.price;
  if (item.ordersToday >= 30) return Math.round((item.price * 1.08) / 250) * 250;
  if (item.ordersToday >= 20) return Math.round((item.price * 1.05) / 250) * 250;
  if (item.ordersToday <= 12) return Math.round((item.price * 0.95) / 250) * 250;
  return item.price;
}


export function SmartMenuPricingCenter({
  menu,
  updateMenu,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
}) {
  return (
    <Card title="Smart Menu Pricing Center">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menu.map((item) => {
          const suggested = getSuggestedPrice(item);

          return (
            <div key={item.id} className="rounded-3xl bg-white/5 p-4">
              <p className="font-black">{item.name}</p>
              <p className="mt-1 text-xs text-white/45">{item.category}</p>

              <div className="mt-4 rounded-2xl bg-black p-4 text-sm">
                <p>الحالي: {item.price.toLocaleString()} د.ع</p>
                <p className="mt-2">
                  المقترح:{" "}
                  <span className="font-black text-[#FF7A00]">
                    {suggested.toLocaleString()} د.ع
                  </span>
                </p>
              </div>

              <button
                disabled={item.outOfStock}
                onClick={() => updateMenu(item.id, { price: suggested })}
                className={`mt-3 w-full rounded-2xl px-4 py-3 text-sm font-bold ${
                  item.outOfStock
                    ? "bg-white/10 text-white/30"
                    : "bg-[#FF7A00] text-black"
                }`}
              >
                اعتماد السعر
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

