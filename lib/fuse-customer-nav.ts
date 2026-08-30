import type { FuseIconName } from "@/components/FuseIcon";

export type FuseCustomerNavItem = {
  href: string;
  label: string;
  icon: FuseIconName;
};

/** Visual order for RTL bottom nav: right → left */
export const FUSE_CUSTOMER_NAV_ITEMS: FuseCustomerNavItem[] = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/restaurants", label: "المطاعم", icon: "search" },
  { href: "/reels", label: "ريلز", icon: "reels" },
  { href: "/order-status", label: "طلباتي", icon: "orders" },
  { href: "/profile", label: "حسابي", icon: "user" },
];

export const FUSE_CUSTOMER_NAV_HIDDEN_PREFIXES = [
  "/privacy",
  "/restaurant-admin",
  "/restaurant-dashboard",
  "/restaurant-orders",
  "/restaurant-live",
  "/restaurant-reels",
  "/fuse-admin",
  "/admin",
  "/driver",
  "/vendor",
  "/ceo-",
  "/system-",
  "/operations-",
  "/mission-",
  "/control-",
  "/fleet-",
  "/dispatch",
  "/smart-",
  "/live-map",
];

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function authNextPath(search: string) {
  const next = new URLSearchParams(search).get("next") || "";
  if (!next.startsWith("/") || next.startsWith("//")) return "";
  const clean = next.split("?")[0];
  return normalizePathname(clean);
}

export function isFuseCustomerNavItemActive(
  pathname: string,
  href: string,
  search = ""
) {
  const path = normalizePathname(pathname);
  if (href === "/") return path === "/";

  if (href === "/restaurants") {
    return path === "/restaurants" || path.startsWith("/restaurants/");
  }

  if (href === "/order-status") {
    if (path === "/order-status" || path === "/orders") return true;
    if (path === "/login" || path === "/signup" || path === "/auth") {
      const next = authNextPath(search);
      return next === "/order-status" || next === "/orders" || next.startsWith("/order-status/");
    }
    return false;
  }

  if (href === "/profile") {
    if (path === "/profile" || path.startsWith("/profile/")) return true;
    if (path === "/login" || path === "/signup" || path === "/auth") {
      const next = authNextPath(search);
      if (next === "/order-status" || next === "/orders" || next.startsWith("/order-status/")) {
        return false;
      }
      return true;
    }
    return false;
  }

  return path === href || path.startsWith(`${href}/`);
}
