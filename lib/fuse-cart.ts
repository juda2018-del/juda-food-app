export type FuseCartItem = {
  id: string;
  name: string;
  restaurant: string;
  restaurantId?: string;
  category?: string;
  price: number;
  qty: number;
  image?: string;
};

export const FUSE_CART_KEY = "fuse_customer_cart_v2";
export const FUSE_CART_EVENT = "fuse-cart-updated";

function safeNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function normalizeCartItem(item: Partial<FuseCartItem>): FuseCartItem | null {
  const id = String(item.id || "").trim();
  const name = String(item.name || "صنف").trim();
  const restaurant = String(item.restaurant || "FUSE").trim();
  const price = safeNumber(item.price, 0);
  const qty = Math.max(1, Math.round(safeNumber(item.qty, 1)));

  if (!id) return null;

  return {
    id,
    name,
    restaurant,
    restaurantId: item.restaurantId,
    category: item.category || "عام",
    price,
    qty,
    image: item.image,
  };
}

export function readFuseCart(): FuseCartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FUSE_CART_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => normalizeCartItem(item))
      .filter((item): item is FuseCartItem => Boolean(item));
  } catch {
    return [];
  }
}

export function writeFuseCart(items: FuseCartItem[]) {
  if (typeof window === "undefined") return;

  const cleanItems = items
    .map((item) => normalizeCartItem(item))
    .filter((item): item is FuseCartItem => Boolean(item));

  window.localStorage.setItem(FUSE_CART_KEY, JSON.stringify(cleanItems));
  window.dispatchEvent(new CustomEvent(FUSE_CART_EVENT, { detail: cleanItems }));
}

export function addFuseCartItem(item: FuseCartItem) {
  if (typeof window === "undefined") return [];

  const normalized = normalizeCartItem(item);
  if (!normalized) return readFuseCart();

  const current = readFuseCart();
  const index = current.findIndex((cartItem) => cartItem.id === normalized.id);

  if (index >= 0) {
    const next = current.map((cartItem, itemIndex) =>
      itemIndex === index
        ? { ...cartItem, qty: cartItem.qty + normalized.qty }
        : cartItem
    );
    writeFuseCart(next);
    return next;
  }

  const next = [...current, normalized];
  writeFuseCart(next);
  return next;
}

export function updateFuseCartQty(id: string, qty: number) {
  const next = readFuseCart()
    .map((item) => (item.id === id ? { ...item, qty: Math.max(0, qty) } : item))
    .filter((item) => item.qty > 0);
  writeFuseCart(next);
  return next;
}

export function clearFuseCart() {
  writeFuseCart([]);
}

export function fuseCartTotals(items: FuseCartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = items.length ? 2000 : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}
