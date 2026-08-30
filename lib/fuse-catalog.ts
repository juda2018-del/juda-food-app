/** Canonical FUSE catalog IDs — must match scripts/fuse-catalog-data.mjs */

export const FUSE_RESTAURANT_IDS = ["fayrouz", "shalteta", "khan", "alforn"] as const;

export const FUSE_MENU_ITEM_IDS = [
  "fayrouz-kahi",
  "fayrouz-makhlema",
  "fayrouz-tea",
  "fayrouz-baqala",
  "shalteta-cheese",
  "shalteta-mix",
  "khan-chicken",
  "khan-rice",
  "alforn-pizza",
  "alforn-manakish",
] as const;

export type FuseMenuItemId = (typeof FUSE_MENU_ITEM_IDS)[number];

export function isCatalogMenuItemId(id: string): id is FuseMenuItemId {
  return (FUSE_MENU_ITEM_IDS as readonly string[]).includes(id);
}

export function restaurantHasLiveCatalog(
  menuItems: Array<{ documentId: string; restaurantId?: string }>,
  restaurantId: string
): boolean {
  const clean = restaurantId.trim().toLowerCase();
  return menuItems.some(
    (item) =>
      String(item.restaurantId || "").trim().toLowerCase() === clean &&
      isCatalogMenuItemId(item.documentId)
  );
}

export function catalogIsLive(menuItems: Array<{ documentId: string; restaurantId?: string }>): boolean {
  return FUSE_RESTAURANT_IDS.some((restaurantId) => restaurantHasLiveCatalog(menuItems, restaurantId));
}
