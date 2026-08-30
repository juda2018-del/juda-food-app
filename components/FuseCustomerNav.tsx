"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import FuseIcon from "./FuseIcon";
import {
  FUSE_CUSTOMER_NAV_HIDDEN_PREFIXES,
  FUSE_CUSTOMER_NAV_ITEMS,
  isFuseCustomerNavItemActive,
} from "@/lib/fuse-customer-nav";

export default function FuseCustomerNav() {
  const pathname = usePathname() || "/";
  const search = useSearchParams()?.toString() || "";
  const hidden = FUSE_CUSTOMER_NAV_HIDDEN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (hidden) return null;

  return (
    <nav className="fuse-customer-nav" aria-label="التنقل الرئيسي">
      {FUSE_CUSTOMER_NAV_ITEMS.map((item) => {
        const active = isFuseCustomerNavItemActive(pathname, item.href, search);

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
