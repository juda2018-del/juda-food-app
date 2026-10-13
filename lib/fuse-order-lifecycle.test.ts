import assert from "node:assert/strict";
import test from "node:test";
import {
  canAssignDriver,
  canDriverUpdateOrder,
  canReadOrder,
  canRestaurantUpdateOrder,
  type OrderAccessRecord,
  type OrderReader,
} from "./fuse-order-draft";
import { canDriverTransition, canRestaurantTransition } from "./fuse-order-status";

const customer: OrderReader = { uid: "customer1234", role: "customer" };
const restaurant: OrderReader = { uid: "rest-user", role: "restaurant", restaurantId: "fayrouz" };
const driver: OrderReader = { uid: "driver1234", role: "driver", email: "driver@example.com" };
const admin: OrderReader = { uid: "admin1234", role: "admin" };
const stranger: OrderReader = { uid: "stranger123", role: "customer" };

test("cash order moves from the customer through restaurant, admin, and driver", () => {
  let order: OrderAccessRecord = {
    customerUid: customer.uid,
    restaurantId: "fayrouz",
    status: "جديد",
  };

  assert.equal(canReadOrder(customer, order), true);
  assert.equal(canReadOrder(stranger, order), false);
  assert.equal(canReadOrder(restaurant, order), true);
  assert.equal(canReadOrder(admin, order), true);
  assert.equal(canRestaurantTransition(order.status, "قيد التحضير"), true);
  assert.equal(canRestaurantUpdateOrder(restaurant, order, "قيد التحضير", ["status", "statusAr", "preparingAt"]), true);
  order = { ...order, status: "قيد التحضير" };

  assert.equal(canRestaurantTransition(order.status, "جاهز للتوصيل"), true);
  assert.equal(canRestaurantUpdateOrder(customer, order, "جاهز للتوصيل", ["status"]), false);
  order = { ...order, status: "جاهز للتوصيل" };

  assert.equal(canAssignDriver(admin), true);
  assert.equal(canAssignDriver(restaurant), false);
  assert.equal(canAssignDriver(driver), false);
  order = { ...order, assignedDriverId: driver.uid, driverId: driver.uid };

  assert.equal(canReadOrder(driver, order), true);
  assert.equal(canDriverTransition(order.status, "قيد التوصيل"), false);
  assert.equal(canDriverUpdateOrder(driver, order, "السائق استلم الطلب", ["status", "pickedUpAt"]), true);
  order = { ...order, status: "السائق استلم الطلب" };

  assert.equal(canDriverUpdateOrder(driver, order, "قيد التوصيل", ["status", "outForDeliveryAt"]), true);
  order = { ...order, status: "قيد التوصيل" };
  assert.equal(canDriverUpdateOrder(driver, order, "تم التسليم", ["status", "deliveredAt"]), true);
  order = { ...order, status: "تم التسليم" };

  assert.equal(canRestaurantUpdateOrder(restaurant, order, "ملغي", ["status"]), false);
  assert.equal(canReadOrder(customer, order), true);
});

test("a restaurant cannot skip ahead and a driver cannot take another driver's order", () => {
  const fresh: OrderAccessRecord = {
    customerUid: customer.uid,
    restaurantId: "fayrouz",
    status: "جديد",
    assignedDriverId: "someone-else",
  };
  assert.equal(canRestaurantTransition("جديد", "قيد التوصيل"), false);
  assert.equal(canDriverUpdateOrder(driver, fresh, "السائق استلم الطلب", ["status"]), false);
  assert.equal(canReadOrder({ uid: "other-rest", role: "restaurant", restaurantId: "khan" }, fresh), false);
});
