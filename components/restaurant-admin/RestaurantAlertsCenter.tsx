"use client";

import type { RestaurantAlert } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

export function RestaurantAlertsCenter({
  alerts,
  updateAlert,
}: {
  alerts: RestaurantAlert[];
  updateAlert: (id: number, data: Partial<RestaurantAlert>) => void;
}) {
  return (
    <Card title="Restaurant Alerts Center">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat
          title="خطورة عالية"
          value={alerts.filter((alert) => alert.level === "عالي").length}
          color="text-red-300"
        />
        <MiniStat
          title="تنبيهات جديدة"
          value={alerts.filter((alert) => alert.status === "جديد").length}
          color="text-yellow-300"
        />
        <MiniStat
          title="قيد المعالجة"
          value={alerts.filter((alert) => alert.status === "قيد المعالجة").length}
          color="text-[#FF7A00]"
        />
        <MiniStat
          title="تم الحل"
          value={alerts.filter((alert) => alert.status === "تم الحل").length}
          color="text-green-300"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{alert.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {alert.type} — {alert.time}
                </p>
              </div>

              <Badge
                text={alert.level}
                color={
                  alert.level === "عالي"
                    ? "bg-red-500/15 text-red-300"
                    : alert.level === "متوسط"
                    ? "bg-yellow-500/15 text-yellow-300"
                    : "bg-green-500/15 text-green-300"
                }
              />
            </div>

            <p className="mt-4 rounded-2xl bg-black p-4 text-sm text-white/65">
              {alert.message}
            </p>

            <button
              onClick={() => updateAlert(alert.id, { status: "تم الحل" })}
              className="mt-3 w-full rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-bold text-black"
            >
              حل التنبيه
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

