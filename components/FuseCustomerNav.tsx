"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "home" | "search" | "reels" | "orders" | "heart";

const items: Array<{ href: string; label: string; icon?: IconName; profile?: boolean }> = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/restaurants", label: "البحث", icon: "search" },
  { href: "/reels", label: "الريلز", icon: "reels" },
  { href: "/order-status", label: "طلباتي", icon: "orders" },
  { href: "/favorites", label: "المفضلة", icon: "heart" },
  { href: "/profile", label: "حسابي", profile: true },
];

const hiddenPrefixes = [
  "/login",
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
    return pathname === "/order-status" || pathname === "/orders" || pathname === "/live-orders";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "reels") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="4" />
        <path d="m7 4 3 4m3-4 3 4m-13 0h18" />
        <path d="m10 12 5 3-5 3Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg {...common}>
        <path d="M6 4h12l1 17-3-2-2 2-2-2-2 2-2-2-3 2Z" />
        <path d="M9 9h6M9 13h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
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
              {item.profile ? (
                <span className="fuse-nav-avatar" aria-hidden="true">
                  F
                  <i />
                </span>
              ) : (
                <NavIcon name={item.icon!} />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
