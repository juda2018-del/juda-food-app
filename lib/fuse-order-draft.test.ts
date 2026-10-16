import assert from "node:assert/strict";
import test from "node:test";
import {
  COD_PAYMENT_METHOD,
  buildCustomerCodOrder,
  buildRestaurantNewOrderNotification,
  canAssignDriver,
  canCreateCustomerOrder,
  canDriverUpdateOrder,
  canReadOrder,
  canRestaurantUpdateOrder,
  createSubmitGuard,
  customerOrderDocumentId,
  type MenuRecord,
  type RestaurantRecord,
} from "./fuse-order-draft";
import type { FuseCartItem } from "./fuse-cart";

const actor = { uid: "customer1234", email: "customer@example.com", role: "customer" };
const attemptId = "a1b2c3d4e5f60718";

const restaurant: RestaurantRecord = {
  exists: true,
  name: "فيروز",
  active: true,
  open: true,
  deliveryFee: 2500,
  minOrder: 3000,
};

const menu: Record<string, MenuRecord> = {
  "menu-1": {
    exists: true,
    restaurantId: "fayrouz",
    name: "فطور فيروز",
    price: 4000,
    category: "فطور",
    available: true,
  },
};

function item(overrides: Partial<FuseCartItem> = {}): FuseCartItem {
  return {
    id: "menu-1",
    name: "سعر مزور",
    restaurant: "مطعم مزور",
    restaurantId: "fayrouz",
    price: 1,
    qty: 1,
    category: "عام",
    ...overrides,
  };
}

function build(overrides: Partial<Parameters<typeof buildCustomerCodOrder>[0]> = {}) {
  return buildCustomerCodOrder({
    actor,
    items: [item()],
    restaurantId: "fayrouz",
    restaurant,
    menuById: menu,
    customerName: "زبون تجريبي",
    phone: "07701234567",
    address: "المنصور، شارع 14، قرب الساحة",
    note: "بدون بصل",
    attemptId,
    ...overrides,
  });
}

test("replaces client prices and restaurant names with menu snapshots", () => {
  const result = build();
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.order.items[0].price, 4000);
  assert.equal(result.order.items[0].name, "فطور فيروز");
  assert.equal(result.order.restaurantName, "فيروز");
  assert.equal(result.order.subtotal, 4000);
  assert.equal(result.order.deliveryFee, 2500);
  assert.equal(result.order.total, 6500);
  assert.equal(result.order.amount, 6500);
  assert.equal(result.order.paymentMethod, COD_PAYMENT_METHOD);
  assert.equal(result.order.paymentStatus, "awaiting_delivery");
  assert.equal(result.order.currency, "IQD");
  assert.equal(result.order.status, "جديد");
  assert.equal(result.order.customerUid, actor.uid);
});

test("uses the 2000 fallback when the restaurant has no delivery fee", () => {
  const result = build({
    restaurant: { ...restaurant, deliveryFee: undefined, minOrder: 0 },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.order.deliveryFee, 2000);
  assert.equal(result.order.total, 6000);
});

test("rejects a missing product, a foreign product, and a closed restaurant", () => {
  assert.equal(build({ menuById: {} }).ok, false);
  const foreign = build({
    menuById: { "menu-1": { ...menu["menu-1"], restaurantId: "other" } },
  });
  assert.equal(foreign.ok, false);
  if (!foreign.ok) assert.match(foreign.message, /لا يتبع/);
  const closed = build({ restaurant: { ...restaurant, open: false } });
  assert.equal(closed.ok, false);
});

test("rejects spoofed ownership, staff checkout, and a short address", () => {
  assert.equal(canCreateCustomerOrder(null), false);
  assert.equal(canCreateCustomerOrder({ uid: "abc", role: "restaurant" }), false);
  assert.equal(build({ actor: { uid: "restaurant123", role: "restaurant" } }).ok, false);
  assert.equal(build({ address: "قصير" }).ok, false);
});

test("rejects totals below the restaurant minimum", () => {
  const result = build({
    restaurant: { ...restaurant, minOrder: 9000 },
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.message, /الحد الأدنى/);
});

test("keeps one document id for the same attempt and blocks a second submit", () => {
  const first = build();
  const second = build();
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.order.documentId, second.order.documentId);
  assert.equal(first.order.documentId, customerOrderDocumentId(actor.uid, attemptId));

  const guard = createSubmitGuard();
  assert.equal(guard.acquire(), true);
  assert.equal(guard.acquire(), false);
  guard.release();
  assert.equal(guard.acquire(), true);
});

test("notification payload stays bound to the customer and order", () => {
  const result = build();
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const notification = buildRestaurantNewOrderNotification(result.order);
  assert.equal(notification.customerUid, actor.uid);
  assert.equal(notification.orderDocumentId, result.order.documentId);
  assert.equal(notification.orderId, result.order.orderId);
  assert.equal(notification.type, "order");
  assert.equal(notification.audience, "restaurant");
  assert.ok(notification.message.length >= 10 && notification.message.length <= 220);
});

test("customer ownership and staff transitions follow the order rules", () => {
  const order = {
    customerUid: "customer1234",
    restaurantId: "fayrouz",
    status: "جديد",
    assignedDriverId: "driver1234",
  };
  assert.equal(canReadOrder({ uid: "customer1234", role: "customer" }, order), true);
  assert.equal(canReadOrder({ uid: "other-customer", role: "customer" }, order), false);
  assert.equal(canReadOrder(null, order), false);

  const restaurantActor = { uid: "rest-user", role: "restaurant", restaurantId: "fayrouz" };
  assert.equal(
    canRestaurantUpdateOrder(restaurantActor, order, "قيد التحضير", ["status", "updatedAt"]),
    true
  );
  assert.equal(
    canRestaurantUpdateOrder(restaurantActor, order, "تم التسليم", ["status"]),
    false
  );
  assert.equal(
    canRestaurantUpdateOrder(restaurantActor, order, "قيد التحضير", ["assignedDriverId"]),
    false
  );

  const driver = { uid: "driver1234", role: "driver", email: "driver@example.com" };
  const ready = { ...order, status: "جاهز للتوصيل" };
  assert.equal(canDriverUpdateOrder(driver, ready, "قيد التوصيل", ["status"]), false);
  assert.equal(canDriverUpdateOrder(driver, ready, "السائق استلم الطلب", ["status", "pickedUpAt"]), true);
  assert.equal(canAssignDriver(driver), false);
  assert.equal(canAssignDriver({ uid: "admin1", role: "admin" }), true);
});
