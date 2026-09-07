/** Shared restaurant open/close checks for customer UI and admin toggles. */

export type FuseRestaurantOpenFields = {
  active?: boolean;
  open?: boolean;
  isOpen?: boolean;
  status?: string;
  deliveryFee?: number;
};

/**
 * Soft-launch open check aligned with firestore.rules restaurantAccepts():
 * active/open/isOpen must not be false, and status must not be «مغلق».
 * Reading `active` is fine; restaurant-role writes must not touch `active`
 * (rules only allow open/isOpen/status among status fields).
 */
export function isFuseRestaurantOpen(item: FuseRestaurantOpenFields | null | undefined): boolean {
  if (!item) return false;
  return (
    item.active !== false &&
    item.open !== false &&
    item.isOpen !== false &&
    item.status !== "مغلق"
  );
}

export function resolveRestaurantDeliveryFee(
  item: FuseRestaurantOpenFields | null | undefined,
  fallback = 2000
): number {
  const fee = Number(item?.deliveryFee);
  if (Number.isFinite(fee) && fee >= 0) return fee;
  return fallback;
}
