import { Priority, Status } from "./types";

export const ORDER_STATUSES: Status[] = [
  "جديد",
  "قيد التحضير",
  "جاهز",
  "قيد التوصيل",
  "تم التسليم",
];

export function priorityColor(priority: Priority) {
  if (priority === "عاجل") return "bg-red-500/15 text-red-300";
  if (priority === "مهم") return "bg-yellow-500/15 text-yellow-300";
  return "bg-white/10 text-white/55";
}

export function statusAccent(status: Status) {
  if (status === "جديد") return "border-[#FF7A00]/40 bg-[#FF7A00]/10";
  if (status === "قيد التحضير")
    return "border-yellow-500/30 bg-yellow-500/10";
  if (status === "جاهز")
    return "border-sky-500/30 bg-sky-500/10";
  if (status === "قيد التوصيل")
    return "border-purple-500/30 bg-purple-500/10";
  if (status === "تم التسليم")
    return "border-green-500/30 bg-green-500/10";

  return "border-red-500/30 bg-red-500/10";
}

export function nextStatus(status: Status): Status | null {
  if (status === "جديد") return "قيد التحضير";
  if (status === "قيد التحضير") return "جاهز";
  if (status === "جاهز") return "قيد التوصيل";
  if (status === "قيد التوصيل") return "تم التسليم";

  return null;
}