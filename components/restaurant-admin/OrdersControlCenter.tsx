"use client";

import { useState } from "react";
import type { Order, Priority, Status } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";

function priorityColor(priority: Priority) {
  if (priority === "عاجل") return "bg-red-500/15 text-red-300";
  if (priority === "مهم") return "bg-yellow-500/15 text-yellow-300";
  return "bg-white/10 text-white/55";
}


function statusAccent(status: Status) {
  if (status === "جديد") return "border-[#FF7A00]/40 bg-[#FF7A00]/10";
  if (status === "قيد التحضير") return "border-yellow-500/30 bg-yellow-500/10";
  if (status === "جاهز") return "border-sky-500/30 bg-sky-500/10";
  if (status === "قيد التوصيل") return "border-purple-500/30 bg-purple-500/10";
  if (status === "تم التسليم") return "border-green-500/30 bg-green-500/10";
  return "border-red-500/30 bg-red-500/10";
}


function nextStatus(status: Status): Status | null {
  if (status === "جديد") return "قيد التحضير";
  if (status === "قيد التحضير") return "جاهز";
  if (status === "جاهز") return "قيد التوصيل";
  if (status === "قيد التوصيل") return "تم التسليم";
  return null;
}


export function OrdersControlCenter({
  orders,
  updateOrder,
}: {
  orders: Order[];
  updateOrder: (id: string, status: Status) => void;
}) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"الكل" | Priority>("الكل");

  const filtered = orders.filter((order) => {
    const q = search.trim();

    const matchesSearch =
      !q ||
      order.id.includes(q) ||
      order.customer.includes(q) ||
      order.area.includes(q) ||
      order.driver.includes(q) ||
      order.phone.includes(q);

    const matchesPriority = priority === "الكل" || order.priority === priority;

    return matchesSearch && matchesPriority && order.status !== "مرفوض";
  });

  const totalValue = filtered.reduce((sum, order) => sum + order.amount, 0);
  const urgentCount = filtered.filter((order) => order.priority === "عاجل").length;

  return (
    <Card
      title="Orders Board Pro"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-sm font-bold text-[#FF7A00]">
          Live Board
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث: رقم الطلب، الزبون، المنطقة، السائق..."
          className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none md:col-span-2"
        />

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as "الكل" | Priority)}
          className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
        >
          {["الكل", "عاجل", "مهم", "عادي"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <div className="rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 px-4 py-3 text-sm text-[#FF7A00]">
          {filtered.length} طلب — {totalValue.toLocaleString()} د.ع
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {ORDER_STATUSES.map((status) => (
          <MiniStat
            key={status}
            title={status}
            value={filtered.filter((order) => order.status === status).length}
            color={
              status === "تم التسليم"
                ? "text-green-300"
                : status === "قيد التحضير"
                ? "text-yellow-300"
                : status === "جاهز"
                ? "text-sky-300"
                : status === "قيد التوصيل"
                ? "text-purple-300"
                : "text-[#FF7A00]"
            }
          />
        ))}
      </div>

      {urgentCount > 0 && (
        <div className="mb-4 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          🔥 يوجد {urgentCount} طلب عاجل. الأفضل تحريكه قبل باقي الطلبات.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {ORDER_STATUSES.map((status) => {
          const columnOrders = filtered.filter((order) => order.status === status);

          return (
            <div
              key={status}
              className={`rounded-3xl border p-3 ${statusAccent(status)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black">{status}</h3>
                <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold">
                  {columnOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-white/35">
                    لا توجد طلبات
                  </div>
                )}

                {columnOrders.map((order) => {
                  const next = nextStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl border border-white/10 bg-[#050505] p-4 shadow-[0_0_25px_rgba(0,0,0,0.25)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{order.id}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {order.time} — {order.area}
                          </p>
                        </div>

                        <Badge
                          text={order.priority}
                          color={priorityColor(order.priority)}
                        />
                      </div>

                      <div className="mt-3 rounded-2xl bg-white/5 p-3">
                        <p className="font-bold">{order.customer}</p>
                        <p className="mt-1 text-xs text-white/45">{order.phone}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item) => (
                          <div
                            key={`${order.id}-${item}`}
                            className="rounded-xl bg-black px-3 py-2 text-xs text-white/60"
                          >
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="rounded-2xl bg-white/5 p-3">
                          <p className="text-white/35">القيمة</p>
                          <p className="mt-1 font-black text-[#FF7A00]">
                            {order.amount.toLocaleString()} د.ع
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-3">
                          <p className="text-white/35">التحضير</p>
                          <p className="mt-1 font-black">{order.prepMinutes} د</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl bg-white/5 p-3 text-xs text-white/55">
                        السائق:{" "}
                        <span className="font-bold text-white">{order.driver}</span>{" "}
                        — الدفع:{" "}
                        <span className="font-bold text-white">{order.payment}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {next && (
                          <button
                            onClick={() => updateOrder(order.id, next)}
                            className="rounded-2xl bg-[#FF7A00] px-3 py-3 text-xs font-black text-black"
                          >
                            نقل إلى {next}
                          </button>
                        )}

                        {order.status !== "تم التسليم" && (
                          <button
                            onClick={() => updateOrder(order.id, "مرفوض")}
                            className="rounded-2xl bg-red-500/15 px-3 py-3 text-xs font-black text-red-300"
                          >
                            رفض
                          </button>
                        )}

                        {order.status === "تم التسليم" && (
                          <button className="col-span-2 rounded-2xl bg-green-500/15 px-3 py-3 text-xs font-black text-green-300">
                            مكتمل
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

