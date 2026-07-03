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
  uid?: string;
  email: string;
  role: FuseRole;
  name?: string;
  phone?: string;
  restaurant?: string;
  restaurantId?: string;
  restaurantName?: string;
  fuseRole?: FuseRole | string;
  fuseEmail?: string;
  displayName?: string;
  customerId?: string;
  source?: string;
  loggedAt?: number;
  createdAt?: number | string;
};

export type FuseNavItem = {
  title?: string;
  label?: string;
  href: string;
  desc?: string;
  icon?: string;
  roles?: FuseRole[];
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
    name: "إدارة FUSE",
  },
  {
    email: "restaurant@fuse.iq",
    aliases: ["vendor@fuse.iq", "restaurant@fuse.com"],
    password: "123456",
    role: "restaurant",
    name: "مطعم فيروز",
    restaurant: "فيروز",
  },
  {
    email: "driver@fuse.iq",
    aliases: ["driver@fuse.com"],
    password: "123456",
    role: "driver",
    name: "سائق FUSE",
    phone: "07701234567",
  },
  {
    email: "customer@fuse.iq",
    aliases: ["customer@fuse.com"],
    password: "123456",
    role: "customer",
    name: "زبون FUSE",
    phone: "07700000000",
  },
];

export const roleTitle: Record<FuseRole, string> = {
  admin: "إدارة",
  restaurant: "مطعم",
  driver: "سائق",
  customer: "زبون",
};

export const roleHome: Record<FuseRole, string> = {
  admin: "/system-tools",
  restaurant: "/restaurant-admin",
  driver: "/driver-app",
  customer: "/customer",
};

export const fuseNavigation: FuseNavItem[] = [
  {
    title: "📡 الطلبات المباشرة",
    label: "الطلبات المباشرة",
    href: "/live-orders",
    desc: "متابعة الطلبات والتحديثات المباشرة",
    icon: "orders",
    roles: ["admin", "restaurant", "driver", "customer"],
  },
  {
    title: "🍽️ لوحة المطعم",
    label: "لوحة المطعم",
    href: "/restaurant-admin",
    desc: "طلبات المطعم والمنيو والتنبيهات",
    icon: "restaurant",
    roles: ["admin", "restaurant"],
  },
  {
    title: "🛵 تطبيق السائق",
    label: "تطبيق السائق",
    href: "/driver-app",
    desc: "طلبات السائق والحالة والموقع",
    icon: "driver",
    roles: ["admin", "driver"],
  },
  {
    title: "⭐ تقييم الطلب",
    label: "تقييم الطلب",
    href: "/ratings",
    desc: "تقييم المطعم والسائق بعد الطلب",
    icon: "star",
    roles: ["admin", "customer"],
  },
  {
    title: "📦 حالة الطلب",
    label: "حالة الطلب",
    href: "/order-status",
    desc: "بحث وتتبع حالة الطلب",
    icon: "tracking",
    roles: ["admin", "customer", "restaurant", "driver"],
  },
  {
    title: "🔔 مركز الإشعارات",
    label: "مركز الإشعارات",
    href: "/notification-center",
    desc: "إشعارات النظام والطلبات",
    icon: "bell",
    roles: ["admin", "restaurant"],
  },
  {
    title: "📊 التقارير",
    label: "التقارير",
    href: "/reports",
    desc: "مبيعات، طلبات، أداء، وتصدير",
    icon: "reports",
    roles: ["admin", "restaurant"],
  },
  {
    title: "⚡ التوزيع التلقائي",
    label: "التوزيع التلقائي",
    href: "/auto-dispatch",
    desc: "اقتراح السائق وربط الطلب",
    icon: "dispatch",
    roles: ["admin"],
  },
  {
    title: "🧰 أدوات النظام",
    label: "أدوات النظام",
    href: "/system-tools",
    desc: "تنظيف البيانات وفحص الصحة",
    icon: "tools",
    roles: ["admin"],
  },
];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePassword(value: string) {
  return value.trim();
}

export function parseFuseRole(value?: unknown): FuseRole | null {
  const role = String(value || "").trim().toLowerCase();

  if (role === "admin" || role === "fuse-admin" || role === "fuse_admin" || role === "owner" || role === "ceo") {
    return "admin";
  }

  if (role === "restaurant" || role === "restaurant-admin" || role === "restaurant_admin" || role === "vendor") {
    return "restaurant";
  }

  if (role === "driver" || role === "captain" || role === "delivery") {
    return "driver";
  }

  if (role === "customer" || role === "user" || role === "client") {
    return "customer";
  }

  return null;
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
    uid: account.email,
    email: account.email,
    role: account.role,
    name: account.name,
    phone: account.phone,
    restaurant: account.restaurant || "",
    restaurantId: account.restaurant || "",
    restaurantName: account.restaurant || "",
    fuseRole: account.role,
    fuseEmail: account.email,
    displayName: account.name,
    loggedAt: Date.now(),
    createdAt: Date.now(),
  };
}

export function navForRole(role: FuseRole | null | undefined) {
  if (!role) {
    return fuseNavigation.filter((item) => item.roles?.includes("customer"));
  }

  return fuseNavigation.filter((item) => item.roles?.includes(role));
}

export function getFuseRoleHome(role: unknown) {
  const parsed = parseFuseRole(role);
  return parsed ? roleHome[parsed] : "/login";
}

export function getFuseRoleTitle(role: unknown) {
  const parsed = parseFuseRole(role);
  return parsed ? roleTitle[parsed] : "فيوز";
}

const publicPrefixes = [
  "/",
  "/login",
  "/logout",
  "/fayrouz",
  "/ahram",
  "/khan",
  "/restaurants",
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
  driver: ["/driver", "/driver-app", "/live-orders", "/order-status", "/live-tracking"],
  customer: ["/", "/customer", "/live-orders", "/order-status", "/ratings", "/fayrouz", "/ahram", "/khan", "/restaurants", "/cart", "/profile"],
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

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function canUseDocumentCookie() {
  return typeof document !== "undefined";
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function readFuseCookie(name: string) {
  if (!canUseDocumentCookie()) return "";

  const cookies = document.cookie.split(";").map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  return safeDecode(match.slice(name.length + 1));
}

export function setFuseCookie(name: string, value: string) {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearFuseCookie(name: string) {
  if (!canUseDocumentCookie()) return;

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearFuseCookies() {
  const cookies = [
    FUSE_COOKIE_ROLE,
    FUSE_COOKIE_EMAIL,
    FUSE_COOKIE_NAME,
    FUSE_COOKIE_PHONE,
    FUSE_COOKIE_RESTAURANT,
  ];

  for (const name of cookies) {
    clearFuseCookie(name);
  }
}

export function normalizeFuseSession(value: Partial<FuseSession> | null | undefined): FuseSession | null {
  if (!value) return null;

  const role = parseFuseRole(value.role || value.fuseRole);
  const email = String(value.email || value.fuseEmail || "").trim().toLowerCase();

  if (!email || !role) return null;

  const restaurant =
    value.restaurant ||
    value.restaurantName ||
    value.restaurantId ||
    readFuseCookie(FUSE_COOKIE_RESTAURANT) ||
    "";

  return {
    uid: value.uid || email,
    email,
    role,
    name: value.name || value.displayName || readFuseCookie(FUSE_COOKIE_NAME) || "",
    phone: value.phone || readFuseCookie(FUSE_COOKIE_PHONE) || "",
    restaurant,
    restaurantId: value.restaurantId || restaurant || "",
    restaurantName: value.restaurantName || restaurant || "",
    fuseRole: role,
    fuseEmail: email,
    displayName: value.displayName || value.name || "",
    customerId: value.customerId,
    source: value.source,
    loggedAt: value.loggedAt || Date.now(),
    createdAt: value.createdAt || Date.now(),
  };
}

export function readFuseSession(): FuseSession | null {
  if (!canUseBrowserStorage()) return null;

  try {
    const raw =
      window.localStorage.getItem(FUSE_LOCAL_SESSION) ||
      window.localStorage.getItem("FUSE_LOCAL_SESSION") ||
      window.localStorage.getItem("fuseUser");

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FuseSession>;
      const session = normalizeFuseSession(parsed);
      if (session) return session;
    }

    return normalizeFuseSession({
      role: readFuseCookie(FUSE_COOKIE_ROLE) as FuseRole,
      email: readFuseCookie(FUSE_COOKIE_EMAIL),
      name: readFuseCookie(FUSE_COOKIE_NAME),
      phone: readFuseCookie(FUSE_COOKIE_PHONE),
      restaurant: readFuseCookie(FUSE_COOKIE_RESTAURANT),
    });
  } catch {
    return null;
  }
}

export function saveFuseSession(sessionInput: FuseSession) {
  if (!canUseBrowserStorage()) return;

  const session = normalizeFuseSession(sessionInput);
  if (!session) return;

  const serialized = JSON.stringify(session);

  window.localStorage.setItem(FUSE_LOCAL_SESSION, serialized);
  window.localStorage.setItem("FUSE_LOCAL_SESSION", serialized);
  window.localStorage.setItem("fuseRole", session.role);
  window.localStorage.setItem("fuseEmail", session.email);
  window.localStorage.setItem("fuseUser", serialized);

  setFuseCookie(FUSE_COOKIE_ROLE, session.role);
  setFuseCookie(FUSE_COOKIE_EMAIL, session.email);
  setFuseCookie(FUSE_COOKIE_NAME, session.name || session.displayName || "");
  setFuseCookie(FUSE_COOKIE_PHONE, session.phone || "");
  setFuseCookie(FUSE_COOKIE_RESTAURANT, session.restaurant || session.restaurantName || session.restaurantId || "");
}

export function writeFuseSession(session: FuseSession) {
  saveFuseSession(session);
}

export function clearFuseSession() {
  if (canUseBrowserStorage()) {
    window.localStorage.removeItem(FUSE_LOCAL_SESSION);
    window.localStorage.removeItem("FUSE_LOCAL_SESSION");
    window.localStorage.removeItem("fuseRole");
    window.localStorage.removeItem("fuseEmail");
    window.localStorage.removeItem("fuseUser");
  }

  clearFuseCookies();
}

export function getSessionRole() {
  return readFuseSession()?.role || null;
}

export function getSessionHome() {
  return getFuseRoleHome(readFuseSession()?.role);
}

export function getSessionTitle() {
  return getFuseRoleTitle(readFuseSession()?.role);
}