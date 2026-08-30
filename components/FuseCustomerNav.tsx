"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import FuseIcon, { type FuseIconName } from "./FuseIcon";

const items: Array<{ href: string; label: string; icon: FuseIconName }> = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/restaurants", label: "المطاعم", icon: "search" },
  { href: "/reels", label: "ريلز", icon: "reels" },
  { href: "/order-status", label: "طلباتي", icon: "orders" },
  { href: "/profile", label: "حسابي", icon: "user" },
];

const hiddenPrefixes = [
  "/login",
  "/signup",
  "/auth",
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

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/restaurants") {
    return pathname === "/restaurants" || pathname.startsWith("/restaurants/");
  }
  if (href === "/order-status") {
    return pathname === "/order-status" || pathname === "/orders";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function FuseCustomerNav() {
  const pathname = usePathname() || "/";
  const hidden = hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (hidden) return null;

  return (
    <nav className="fuse-customer-nav" aria-label="التنقل الرئيسي">
      {items.map((item) => {
        const active = isItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
          >
            <span className="fuse-nav-icon">
              <FuseIcon name={item.icon} size="lg" />
            </span>
            <b>{item.label}</b>
          </Link>
        );
      })}
    </nav>
  );
}
