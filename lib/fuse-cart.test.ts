import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCartItem } from "./fuse-cart";

test("keeps a priced cart line and caps quantity at 50", () => {
  const item = normalizeCartItem({
    id: "menu-1",
    name: "فطور",
    restaurant: "فيروز",
    restaurantId: "fayrouz",
    price: 4000,
    qty: 80,
  });
  assert.equal(item?.qty, 50);
  assert.equal(item?.price, 4000);
});

test("drops a cart line with a missing id or a non-positive price", () => {
  assert.equal(normalizeCartItem({ id: "", name: "فطور", restaurant: "فيروز", price: 4000, qty: 1 }), null);
  assert.equal(normalizeCartItem({ id: "menu-1", name: "فطور", restaurant: "فيروز", price: 0, qty: 1 }), null);
});
