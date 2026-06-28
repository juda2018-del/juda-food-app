export type FuseRole = "admin" | "restaurant" | "driver" | "customer";

export type FuseAccount = {
  email: string;
  password: string;
  role: FuseRole;
  name: string;
  phone?: string;
  restaurant?: string;
  aliases?: string[];
};

export type FuseSession = {
  email: string;
  role: FuseRole;
  name: string;
  phone?: string;
  restaurant?: string;
  loggedAt: number;
};

export const FUSE_COOKIE_ROLE = "fuse_role";
export const FUSE_COOKIE_EMAIL = "fuse_email";
export const FUSE_COOKIE_NAME = "fuse_name";
export const FUSE_COOKIE_RESTAURANT = "fuse_restaurant";
export const FUSE_COOKIE_PHONE = "fuse_phone";
export const FUSE_LOCAL_SESSION = "fuse_session";

export const fuseAccounts: FuseAccount[] = [
  {
    email: "admin@fuse.iq",
    aliases: ["admin@fuse.com"],
    password: "123456",
    role: "admin",
    name: "\u0625\u062F\u0627\u0631\u0629 FUSE",
  },
  {
    email: "restaurant@fuse.iq",
    aliases: ["vendor@fuse.iq", "restaurant@fuse.com"],
    password: "123456",
    role: "restaurant",
    name: "\u0645\u0637\u0639\u0645 \u0641\u064A\u0631\u0648\u0632",
    restaurant: "\u0641\u064A\u0631\u0648\u0632",
  },
  {
    email: "driver@fuse.iq",
    aliases: ["driver@fuse.com"],
    password: "123456",
    role: "driver",
    name: "\u0633\u0627\u0626\u0642 FUSE",
    phone: "07701234567",
  },
  {
    email: "customer@fuse.iq",
    aliases: ["customer@fuse.com"],
    password: "123456",
    role: "customer",
    name: "\u0632\u0628\u0648\u0646 FUSE",
    phone: "07700000000",
  },
];

export const roleTitle: Record<FuseRole, string> = {
  admin: "\u0625\u062F\u0627\u0631\u0629",
  restaurant: "\u0645\u0637\u0639\u0645",
  driver: "\u0633\u0627\u0626\u0642",
  customer: "\u0632\u0628\u0648\u0646",
};

export const roleHome: Record<FuseRole, string> = {
  admin: "/system-tools",
  restaurant: "/restaurant-admin",
  driver: "/driver-app",
  customer: "/live-orders",
};

export type FuseNavItem = {
  title: string;
  href: string;
  desc: string;
  roles: FuseRole[];
};

export const fuseNavigation: FuseNavItem[] = [
  {
    title: "\u{1F4E1} \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",
    href: "/live-orders",
    desc: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629",
    roles: ["admin", "restaurant", "driver", "customer"],
  },
  {
    title: "\u{1F37D}\uFE0F \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0637\u0639\u0645",
    href: "/restaurant-admin",
    desc: "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0637\u0639\u0645 \u0648\u0627\u0644\u0645\u0646\u064A\u0648 \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A",
    roles: ["admin", "restaurant"],
  },
  {
    title: "\u{1F6F5} \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0633\u0627\u0626\u0642",
    href: "/driver-app",
    desc: "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0627\u0626\u0642 \u0648\u0627\u0644\u062D\u0627\u0644\u0629 \u0648\u0627\u0644\u0645\u0648\u0642\u0639",
    roles: ["admin", "driver"],
  },
  {
    title: "\u2B50 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0637\u0644\u0628",
    href: "/ratings",
    desc: "\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0637\u0639\u0645 \u0648\u0627\u0644\u0633\u0627\u0626\u0642 \u0628\u0639\u062F \u0627\u0644\u0637\u0644\u0628",
    roles: ["admin", "customer"],
  },
  {
    title: "\u{1F4E6} \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628",
    href: "/order-status",
    desc: "\u0628\u062D\u062B \u0648\u062A\u062A\u0628\u0639 \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628",
    roles: ["admin", "customer", "restaurant", "driver"],
  },
  {
    title: "\u{1F514} \u0645\u0631\u0643\u0632 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
    href: "/notification-center",
    desc: "\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
    roles: ["admin", "restaurant"],
  },
  {
    title: "\u{1F4CA} \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631",
    href: "/reports",
    desc: "\u0645\u0628\u064A\u0639\u0627\u062A\u060C \u0637\u0644\u0628\u0627\u062A\u060C \u0623\u062F\u0627\u0621\u060C \u0648\u062A\u0635\u062F\u064A\u0631",
    roles: ["admin", "restaurant"],
  },
  {
    title: "\u26A1 \u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A",
    href: "/auto-dispatch",
    desc: "\u0627\u0642\u062A\u0631\u0627\u062D \u0627\u0644\u0633\u0627\u0626\u0642 \u0648\u0631\u0628\u0637 \u0627\u0644\u0637\u0644\u0628",
    roles: ["admin"],
  },
  {
    title: "\u{1F9F0} \u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645",
    href: "/system-tools",
    desc: "\u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0641\u062D\u0635 \u0627\u0644\u0635\u062D\u0629",
    roles: ["admin"],
  },
  {
    title: "\u{1F451} \u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627",
    href: "/restaurant-admin",
    desc: "\u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629",
    roles: ["admin"],
  },
];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePassword(value: string) {
  return value.trim();
}

export function findFuseAccount(email: string, password: string) {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = normalizePassword(password);

  return fuseAccounts.find((account) => {
    const emails = [account.email, ...(account.aliases || [])].map(normalizeEmail);
    const passwordOk =
      account.password === cleanPassword ||
      (account.password === "123456" && cleanPassword === "1234");

    return emails.includes(cleanEmail) && passwordOk;
  });
}

export function buildSession(account: FuseAccount): FuseSession {
  return {
    email: account.email,
    role: account.role,
    name: account.name,
    phone: account.phone,
    restaurant: account.restaurant,
    loggedAt: Date.now(),
  };
}

export function parseFuseRole(value?: string | null): FuseRole | null {
  if (
    value === "admin" ||
    value === "restaurant" ||
    value === "driver" ||
    value === "customer"
  ) {
    return value;
  }

  return null;
}

export function navForRole(role: FuseRole | null) {
  if (!role) {
    return fuseNavigation.filter((item) => item.roles.includes("customer"));
  }

  return fuseNavigation.filter((item) => item.roles.includes(role));
}

const publicPrefixes = [
  "/",
  "/login",
  "/fayrouz",
  "/ahram",
  "/khan",
  "/order-status",
  "/ratings",
];

const protectedPrefixesByRole: Record<FuseRole, string[]> = {
  admin: ["/"],
  restaurant: [
    "/restaurant-admin",
    "/live-orders",
    "/order-status",
    "/reports",
    "/notification-center",
  ],
  driver: ["/driver-app", "/live-orders", "/order-status"],
  customer: ["/", "/live-orders", "/order-status", "/ratings", "/fayrouz", "/ahram", "/khan"],
};

export function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return publicPrefixes.some((prefix) => prefix !== "/" && pathname.startsWith(prefix));
}

export function canRoleAccessPath(role: FuseRole, pathname: string) {
  if (role === "admin") return true;

  const allowed = protectedPrefixesByRole[role] || [];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function fallbackPathForRole(role: FuseRole | null) {
  if (!role) return "/login";
  return roleHome[role] || "/login";
}
