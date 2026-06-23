"use client";

import type { MenuItem, RestaurantAlert } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

export function MenuAvailabilityAI({
  menu,
  updateMenu,
  alerts,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
  alerts: RestaurantAlert[];
}) {
  return (
    <Card title="Menu Availability AI">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat
          title="نافدة"
          value={menu.filter((item) => item.outOfStock).length}
          color="text-red-300"
        />
        <MiniStat
          title="متوفرة"
          value={menu.filter((item) => !item.outOfStock).length}
          color="text-green-300"
        />
        <MiniStat
          title="طلب عالي"
          value={menu.filter((item) => item.ordersToday >= 30).length}
          color="text-[#FF7A00]"
        />
        <MiniStat
          title="تنبيهات المنيو"
          value={alerts.filter((alert) => alert.type === "منيو").length}
          color="text-yellow-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menu.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white/5 p-4">
            <p className="font-black">{item.name}</p>
            <p className="mt-3 text-sm text-white/55">
              {item.outOfStock
                ? "الصنف نافد، الأفضل إخفاؤه مؤقتاً."
                : "الصنف متوفر ويمكن عرضه للزبائن."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => updateMenu(item.id, { active: !item.active })}
                className="rounded-2xl bg-white/10 p-3 text-sm font-bold"
              >
                {item.active ? "إخفاء" : "إظهار"}
              </button>

              <button
                onClick={() =>
                  updateMenu(item.id, { outOfStock: !item.outOfStock })
                }
                className="rounded-2xl bg-[#FF7A00] p-3 text-sm font-bold text-black"
              >
                {item.outOfStock ? "متوفر" : "نافد"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

