import type { FuseCartItem } from "./fuse-cart";
import { isFuseRestaurantOpen, resolveRestaurantDeliveryFee } from "./fuse-restaurant";
import {
  canDriverTransition,
  canRestaurantTransition,
  type FuseOrderStatus,
} from "./fuse-order-status";

export const COD_PAYMENT_METHOD = "cod" as const;
export const COD_PAYMENT_STATUS = "awaiting_delivery" as const;
export const COD_PAYMENT_NOTE = "بوابة الدفع الإلكتروني غير متصلة — الدفع عند الاستلام فقط";
export const MAX_ORDER_ITEMS = 8;
export const MAX_ITEM_QTY = 50;

export type MenuRecord = {
  exists: boolean;
  restaurantId?: string;
  name?: string;
  title?: string;
  category?: string;
  price?: unknown;
  available?: boolean;
  isAvailable?: boolean;
  active?: boolean;
};

export type RestaurantRecord = {
  exists: boolean;
  name?: string;
  active?: boolean;
  open?: boolean;
  isOpen?: boolean;
  status?: string;
  deliveryFee?: unknown;
  minOrder?: unknown;
  minimumOrder?: unknown;
};

export type CustomerActor = {
  uid?: string;
  email?: string;
  role?: string;
};

export type OrderLine = {
  id: string;
  name: string;
  title: string;
  qty: number;
  quantity: number;
  price: number;
  category: string;
};

export type BuiltCustomerOrder = {
  documentId: string;
  orderId: string;
  customerUid: string;
  customerEmail: string;
  customerName: string;
  customer: string;
  phone: string;
  customerPhone: string;
  address: string;
  note: string;
  restaurant: string;
  restaurantName: string;
  restaurantId: string;
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  amount: number;
  currency: "IQD";
  paymentMethod: typeof COD_PAYMENT_METHOD;
  paymentStatus: typeof COD_PAYMENT_STATUS;
  paymentNote: string;
  status: "جديد";
  source: "customer-cart-page";
};

export type OrderDraftResult =
  | { ok: true; order: BuiltCustomerOrder }
  | { ok: false; message: string };

export type OrderReader = {
  uid?: string;
  email?: string;
  role?: string;
  restaurantId?: string;
};

export type OrderAccessRecord = {
  customerUid?: string;
  restaurantId?: string;
  driverId?: string;
  driverUid?: string;
  assignedDriverId?: string;
  driverEmail?: string;
  assignedDriverEmail?: string;
  status?: string;
};

export const RESTAURANT_ORDER_UPDATE_KEYS = [
  "status",
  "statusAr",
  "updatedAt",
  "updatedAtText",
  "restaurantUpdatedAt",
  "acceptedAt",
  "rejectedAt",
  "readyAt",
  "preparingAt",
  "restaurantNote",
] as const;

export const DRIVER_ORDER_UPDATE_KEYS = [
  "status",
  "statusAr",
  "updatedAt",
  "driverUpdatedAt",
  "pickedUpAt",
  "outForDeliveryAt",
  "deliveredAt",
  "driverLatitude",
  "driverLongitude",
  "driverLocationUpdatedAt",
  "driverId",
  "driverUid",
  "driverEmail",
  "driverName",
  "driverPhone",
  "assignedDriverId",
  "assignedDriverEmail",
  "assignedDriverName",
  "assignedDriverPhone",
] as const;

export function normalizeIraqiPhone(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^0-9+]/g, "");
}

export function isValidIraqiMobile(value: string) {
  return /^07\d{9}$/.test(normalizeIraqiPhone(value).replace(/^\+964/, "0"));
}

export function newOrderAttemptId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.floor(Math.random() * 0xffffffff).toString(16)}`.slice(0, 16);
}

export function customerOrderDocumentId(uid: string, attemptId: string) {
  const uidPart = String(uid || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 28);
  const attemptPart = String(attemptId || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
  if (uidPart.length < 8 || attemptPart.length < 8) return "";
  return `ord_${uidPart}_${attemptPart}`;
}

export function customerOrderNumber(attemptId: string) {
  const hex = String(attemptId || "").replace(/[^a-fA-F0-9]/g, "").slice(0, 8) || "0";
  const body = Number.parseInt(hex, 16).toString().slice(-8).padStart(8, "0");
  return `FUSE-${body}`;
}

/** Synchronous lock so a second click cannot pass the async `saving` state gap. */
export function createSubmitGuard() {
  let held = false;
  return {
    acquire() {
      if (held) return false;
      held = true;
      return true;
    },
    release() {
      held = false;
    },
  };
}

function fail(message: string): OrderDraftResult {
  return { ok: false, message };
}

function menuAvailable(item: MenuRecord) {
  return item.available !== false && item.isAvailable !== false && item.active !== false;
}

function formatIQD(value: number) {
  return `${Number(value || 0).toLocaleString("en-US")} د.ع`;
}

export function buildRestaurantNewOrderNotification(order: BuiltCustomerOrder) {
  const message = `وصل طلب جديد من ${order.customerName} بقيمة ${formatIQD(order.total)}.`;
  return {
    type: "order" as const,
    audience: "restaurant" as const,
    title: "طلب جديد" as const,
    message,
    customerUid: order.customerUid,
    restaurant: order.restaurantName,
    restaurantName: order.restaurantName,
    restaurantId: order.restaurantId,
    phone: order.phone,
    orderId: order.orderId,
    orderDocumentId: order.documentId,
    read: false as const,
  };
}

/**
 * Build a cash-on-delivery order from restaurant and menu snapshots.
 * Client cart prices and delivery fees are ignored.
 */
export function buildCustomerCodOrder(input: {
  actor: CustomerActor | null;
  items: FuseCartItem[];
  restaurantId: string;
  restaurant: RestaurantRecord | null;
  menuById: Record<string, MenuRecord | undefined>;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  attemptId: string;
}): OrderDraftResult {
  const actor = input.actor;
  if (!actor?.uid || actor.role !== "customer") {
    return fail("تأكيد الطلب متاح لحساب الزبون فقط.");
  }

  const items = input.items;
  if (!items.length) return fail("السلة فارغة. أضف صنفاً واحداً على الأقل.");
  if (items.length > MAX_ORDER_ITEMS) {
    return fail("الحد الأقصى 8 أصناف مختلفة في الطلب الواحد. قلل الأصناف ثم أكد.");
  }

  const customerName = input.customerName.trim();
  if (customerName.length < 2 || customerName.length > 80) return fail("اكتب اسم الزبون.");
  if (!isValidIraqiMobile(input.phone)) return fail("اكتب رقم هاتف عراقي صحيح مثل 07701234567.");
  const address = input.address.trim();
  if (address.length < 8 || address.length > 220) return fail("اكتب عنوان توصيل واضحاً.");

  const restaurantId = String(input.restaurantId || "").trim();
  if (!restaurantId) return fail("تعذر تحديد المطعم. فرّغ السلة وأعد إضافة الأصناف.");
  if (items.some((item) => String(item.restaurantId || "").trim() !== restaurantId)) {
    return fail("السلة تحتوي أصنافاً من أكثر من مطعم. فرّغ السلة وأعد الطلب.");
  }

  const restaurant = input.restaurant;
  if (!restaurant?.exists) return fail("هذا المطعم غير موجود أو لم يعد متاحاً.");
  if (
    !isFuseRestaurantOpen({
      active: restaurant.active,
      open: restaurant.open,
      isOpen: restaurant.isOpen,
      status: restaurant.status,
    })
  ) {
    return fail("المطعم مغلق حالياً ولا يستقبل طلبات.");
  }

  const restaurantName = String(restaurant.name || "").trim();
  if (restaurantName.length < 2 || restaurantName.length > 120) {
    return fail("بيانات المطعم غير مكتملة. تواصل مع الدعم.");
  }

  const documentId = customerOrderDocumentId(actor.uid, input.attemptId);
  const orderId = customerOrderNumber(input.attemptId);
  if (!documentId || orderId.length < 8 || orderId.length > 40) {
    return fail("تعذر تثبيت رقم الطلب. حاول مرة ثانية.");
  }

  const lines: OrderLine[] = [];
  for (const item of items) {
    const id = String(item.id || "").trim();
    if (!id || id.length > 80) return fail("تعذر تحديد الصنف. فرّغ السلة وأعد إضافة الأصناف.");

    const menu = input.menuById[id];
    if (!menu?.exists) return fail(`الصنف ${item.name} لم يعد متوفراً.`);
    if (!menuAvailable(menu)) return fail(`الصنف ${item.name} غير متوفر حالياً.`);

    const liveRestaurantId = String(menu.restaurantId || "").trim();
    if (!liveRestaurantId) return fail(`الصنف ${item.name} غير مرتبط بمطعم.`);
    if (liveRestaurantId !== restaurantId) return fail(`الصنف ${item.name} لا يتبع لهذا المطعم.`);

    const price = Number(menu.price);
    if (!Number.isFinite(price) || price <= 0) return fail(`سعر الصنف ${item.name} غير صالح.`);

    const qty = Math.round(Number(item.qty) || 0);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QTY) {
      return fail(`كمية الصنف ${item.name} غير صالحة.`);
    }

    const name = String(menu.name || menu.title || item.name || "").trim();
    if (name.length < 1 || name.length > 120) return fail(`اسم الصنف ${item.name} غير صالح.`);

    lines.push({
      id,
      name,
      title: name,
      qty,
      quantity: qty,
      price,
      category: String(menu.category || item.category || "عام"),
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const minOrder = Number(restaurant.minOrder || restaurant.minimumOrder || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    return fail(`الحد الأدنى للطلب ${Number(minOrder).toLocaleString("ar-IQ")} د.ع`);
  }

  const deliveryFee = resolveRestaurantDeliveryFee({
    deliveryFee: Number(restaurant.deliveryFee),
  });
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return fail("رسوم التوصيل غير صالحة.");
  }

  const total = subtotal + deliveryFee;
  if (total !== subtotal + deliveryFee || subtotal < 0) {
    return fail("تعذر حساب إجمالي الطلب.");
  }

  const phone = normalizeIraqiPhone(input.phone).replace(/^\+964/, "0");
  const order: BuiltCustomerOrder = {
    documentId,
    orderId,
    customerUid: actor.uid,
    customerEmail: String(actor.email || ""),
    customerName,
    customer: customerName,
    phone,
    customerPhone: phone,
    address,
    note: String(input.note || "").trim().slice(0, 300),
    restaurant: restaurantName,
    restaurantName,
    restaurantId,
    items: lines,
    subtotal,
    deliveryFee,
    total,
    amount: total,
    currency: "IQD",
    paymentMethod: COD_PAYMENT_METHOD,
    paymentStatus: COD_PAYMENT_STATUS,
    paymentNote: COD_PAYMENT_NOTE,
    status: "جديد",
    source: "customer-cart-page",
  };

  return { ok: true, order };
}

export function canCreateCustomerOrder(actor: CustomerActor | null | undefined) {
  return Boolean(actor?.uid) && actor?.role === "customer";
}

export function canReadOrder(actor: OrderReader | null | undefined, order: OrderAccessRecord) {
  if (!actor?.uid || !actor.role) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "customer") return order.customerUid === actor.uid;
  if (actor.role === "restaurant") {
    return Boolean(actor.restaurantId) && order.restaurantId === actor.restaurantId;
  }
  if (actor.role === "driver") {
    const email = String(actor.email || "").trim().toLowerCase();
    return (
      order.driverUid === actor.uid ||
      order.driverId === actor.uid ||
      order.assignedDriverId === actor.uid ||
      (email.length > 0 &&
        (String(order.driverEmail || "").toLowerCase() === email ||
          String(order.assignedDriverEmail || "").toLowerCase() === email))
    );
  }
  return false;
}

export function keysAllowed(keys: string[], allowed: readonly string[]) {
  return keys.every((key) => allowed.includes(key));
}

export function canRestaurantUpdateOrder(
  actor: OrderReader | null | undefined,
  order: OrderAccessRecord,
  nextStatus: FuseOrderStatus,
  changedKeys: string[]
) {
  if (actor?.role !== "restaurant") return false;
  if (!canReadOrder(actor, order)) return false;
  if (!keysAllowed(changedKeys, RESTAURANT_ORDER_UPDATE_KEYS)) return false;
  return canRestaurantTransition(order.status, nextStatus);
}

export function canDriverUpdateOrder(
  actor: OrderReader | null | undefined,
  order: OrderAccessRecord,
  nextStatus: FuseOrderStatus,
  changedKeys: string[]
) {
  if (actor?.role !== "driver") return false;
  if (!canReadOrder(actor, order)) return false;
  if (!keysAllowed(changedKeys, DRIVER_ORDER_UPDATE_KEYS)) return false;
  return canDriverTransition(order.status, nextStatus);
}

/** Driver assignment stays an admin operation. Restaurant and driver cannot self-assign. */
export function canAssignDriver(actor: OrderReader | null | undefined) {
  return actor?.role === "admin" && Boolean(actor.uid);
}
