export const FUSE_ORDER_STATUSES = [
  "جديد",
  "قيد التحضير",
  "جاهز للتوصيل",
  "قيد التوصيل",
  "تم التسليم",
  "مرفوض",
  "ملغي",
] as const;

export type FuseOrderStatus = (typeof FUSE_ORDER_STATUSES)[number];

const STATUS_ALIASES: Record<string, FuseOrderStatus> = {
  new: "جديد",
  pending: "جديد",
  preparing: "قيد التحضير",
  ready: "جاهز للتوصيل",
  جاهز: "جاهز للتوصيل",
  delivering: "قيد التوصيل",
  "out_for_delivery": "قيد التوصيل",
  "السائق استلم": "قيد التوصيل",
  picked_up: "قيد التوصيل",
  done: "تم التسليم",
  delivered: "تم التسليم",
  Delivered: "تم التسليم",
  rejected: "مرفوض",
  cancelled: "ملغي",
  Cancelled: "ملغي",
};

export function normalizeFuseOrderStatus(status?: string | null): FuseOrderStatus {
  const clean = String(status || "").trim();
  if (!clean) return "جديد";
  if (STATUS_ALIASES[clean]) return STATUS_ALIASES[clean];
  if ((FUSE_ORDER_STATUSES as readonly string[]).includes(clean)) return clean as FuseOrderStatus;
  return "جديد";
}

export function fuseOrderStatusLabel(status?: string | null, statusAr?: string | null) {
  if (statusAr && String(statusAr).trim()) return String(statusAr).trim();
  return normalizeFuseOrderStatus(status);
}

export function fuseCustomerProgressIndex(status?: string | null) {
  const normalized = normalizeFuseOrderStatus(status);
  const steps = ["جديد", "قيد التحضير", "جاهز للتوصيل", "قيد التوصيل", "تم التسليم"];
  const index = steps.indexOf(normalized);
  return index >= 0 ? index : 0;
}
