export type FuseRole = "admin" | "restaurant" | "driver" | "customer";

export type FuseAccount = {
  email: string;
  role: FuseRole;
  name: string;
  phone?: string;
  restaurant?: string;
  restaurantId?: string;
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

// Kept only as public account metadata for old imports. Passwords are never stored in source.
export const fuseAccounts: FuseAccount[] = [];

export const roleTitle: Record<FuseRole, string> = {
  admin: "إدارة",
  restaurant: "مطعم",
  driver: "سائق",
  customer: "زبون",
};

export const roleHome: Record<FuseRole, string> = {
  admin: "/fuse-admin",
  restaurant: "/restaurant-admin",
  driver: "/driver-app",
  customer: "/customer",
};

export const fuseNavigation: FuseNavItem[] = [
  { title: "📡 الطلبات المباشرة", label: "الطلبات المباشرة", href: "/live-orders", desc: "متابعة الطلبات والتحديثات المباشرة", icon: "orders", roles: ["admin", "restaurant", "driver", "customer"] },
  { title: "🍽️ لوحة المطعم", label: "لوحة المطعم", href: "/restaurant-admin", desc: "طلبات المطعم والمنيو والتنبيهات", icon: "restaurant", roles: ["admin", "restaurant"] },
  { title: "🛵 تطبيق السائق", label: "تطبيق السائق", href: "/driver-app", desc: "طلبات السائق والحالة والموقع", icon: "driver", roles: ["driver"] },
  { title: "🎬 ريلز المطاعم", label: "الريلز", href: "/reels", desc: "فيديوهات قصيرة للأصناف والعروض داخل FUSE", icon: "reels", roles: ["admin", "restaurant", "customer"] },
  { title: "⭐ تقييم الطلب", label: "تقييم الطلب", href: "/ratings", desc: "تقييم المطعم والسائق بعد الطلب", icon: "star", roles: ["customer"] },
  { title: "📦 حالة الطلب", label: "حالة الطلب", href: "/order-status", desc: "بحث وتتبع حالة الطلب", icon: "tracking", roles: ["customer"] },
  { title: "🔔 مركز الإشعارات", label: "مركز الإشعارات", href: "/notification-center", desc: "إشعارات النظام والطلبات", icon: "bell", roles: ["admin", "restaurant"] },
  { title: "📊 التقارير", label: "التقارير", href: "/reports", desc: "مبيعات وطلبات وأداء", icon: "reports", roles: ["admin", "restaurant"] },
  { title: "⚡ توزيع الطلبات", label: "توزيع الطلبات", href: "/auto-dispatch", desc: "ربط الطلبات بالسائقين", icon: "dispatch", roles: ["admin"] },
  { title: "🛵 إدارة السائقين", label: "إدارة السائقين", href: "/drivers-admin", desc: "إضافة وتشغيل السائقين", icon: "driver-admin", roles: ["admin"] },
  { title: "🧰 أدوات النظام", label: "أدوات النظام", href: "/system-tools", desc: "فحص صحة النظام", icon: "tools", roles: ["admin"] },
];

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePassword(value: string) {
  return value;
}

export function parseFuseRole(value?: unknown): FuseRole | null {
  const role = String(value || "").trim().toLowerCase();
  if (["admin", "fuse-admin", "fuse_admin", "owner", "ceo"].includes(role)) return "admin";
  if (["restaurant", "restaurant-admin", "restaurant_admin", "vendor"].includes(role)) return "restaurant";
  if (["driver", "captain", "delivery"].includes(role)) return "driver";
  if (["customer", "user", "client"].includes(role)) return "customer";
  return null;
}

// Legacy password login is deliberately disabled. Use Firebase Authentication.
export function findFuseAccount(_email: string, _password: string): FuseAccount | undefined {
  return undefined;
}

export function buildSession(account: FuseAccount): FuseSession {
  const restaurant = account.restaurantId || account.restaurant || "";
  return {
    uid: account.email,
    email: normalizeEmail(account.email),
    role: account.role,
    name: account.name,
    phone: account.phone,
    restaurant,
    restaurantId: restaurant,
    restaurantName: account.restaurant || restaurant,
    fuseRole: account.role,
    fuseEmail: normalizeEmail(account.email),
    displayName: account.name,
    source: "firebase-auth",
    loggedAt: Date.now(),
    createdAt: Date.now(),
  };
}

export function navForRole(role: FuseRole | null | undefined) {
  if (!role) return [];
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

const publicPrefixes = ["/", "/login", "/logout", "/fayrouz", "/ahram", "/khan", "/restaurants", "/reels", "/order-status", "/ratings", "/cart", "/profile", "/support"];

const protectedPrefixesByRole: Record<FuseRole, string[]> = {
  admin: ["/fuse-admin", "/live-orders", "/restaurant-admin", "/reports", "/notification-center", "/auto-dispatch", "/drivers-admin", "/system-tools", "/reels-review"],
  restaurant: ["/restaurant-admin", "/live-orders", "/reports", "/notification-center", "/restaurant-reels"],
  driver: ["/driver", "/driver-app", "/live-orders", "/live-tracking"],
  customer: ["/customer", "/live-orders", "/reels", "/order-status", "/ratings", "/fayrouz", "/ahram", "/khan", "/restaurants", "/cart", "/profile"],
};

export function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return publicPrefixes.some((prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/")));
}

export function canRoleAccessPath(role: FuseRole, pathname: string) {
  const allowed = protectedPrefixesByRole[role] || [];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export function fallbackPathForRole(role: FuseRole | null) {
  return role ? roleHome[role] : "/login";
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function canUseDocumentCookie() {
  return typeof document !== "undefined";
}

function safeDecode(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function readFuseCookie(name: string) {
  if (!canUseDocumentCookie()) return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? safeDecode(match.slice(name.length + 1)) : "";
}

export function setFuseCookie(name: string, value: string) {
  if (!canUseDocumentCookie()) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax; Secure`;
}

export function clearFuseCookie(name: string) {
  if (!canUseDocumentCookie()) return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

export function clearFuseCookies() {
  [FUSE_COOKIE_ROLE, FUSE_COOKIE_EMAIL, FUSE_COOKIE_NAME, FUSE_COOKIE_PHONE, FUSE_COOKIE_RESTAURANT].forEach(clearFuseCookie);
}

export function normalizeFuseSession(value: Partial<FuseSession> | null | undefined): FuseSession | null {
  if (!value) return null;
  const role = parseFuseRole(value.role || value.fuseRole);
  const email = normalizeEmail(String(value.email || value.fuseEmail || ""));
  if (!email || !role) return null;
  const restaurant = value.restaurant || value.restaurantName || value.restaurantId || readFuseCookie(FUSE_COOKIE_RESTAURANT) || "";
  return {
    uid: value.uid || email,
    email,
    role,
    name: value.name || value.displayName || readFuseCookie(FUSE_COOKIE_NAME) || "",
    phone: value.phone || readFuseCookie(FUSE_COOKIE_PHONE) || "",
    restaurant,
    restaurantId: value.restaurantId || restaurant,
    restaurantName: value.restaurantName || restaurant,
    fuseRole: role,
    fuseEmail: email,
    displayName: value.displayName || value.name || "",
    customerId: value.customerId,
    source: value.source || "firebase-auth",
    loggedAt: value.loggedAt || Date.now(),
    createdAt: value.createdAt || Date.now(),
  };
}

export function readFuseSession(): FuseSession | null {
  if (!canUseBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(FUSE_LOCAL_SESSION) || window.localStorage.getItem("FUSE_LOCAL_SESSION") || window.localStorage.getItem("fuseUser");
    if (raw) {
      const session = normalizeFuseSession(JSON.parse(raw) as Partial<FuseSession>);
      if (session) return session;
    }
    return normalizeFuseSession({
      role: readFuseCookie(FUSE_COOKIE_ROLE) as FuseRole,
      email: readFuseCookie(FUSE_COOKIE_EMAIL),
      name: readFuseCookie(FUSE_COOKIE_NAME),
      phone: readFuseCookie(FUSE_COOKIE_PHONE),
      restaurant: readFuseCookie(FUSE_COOKIE_RESTAURANT),
    });
  } catch { return null; }
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

export function writeFuseSession(session: FuseSession) { saveFuseSession(session); }

export function clearFuseSession() {
  if (canUseBrowserStorage()) {
    [FUSE_LOCAL_SESSION, "FUSE_LOCAL_SESSION", "fuseRole", "fuseEmail", "fuseUser"].forEach((key) => window.localStorage.removeItem(key));
  }
  clearFuseCookies();
}

export function getSessionRole() { return readFuseSession()?.role || null; }
export function getSessionHome() { return getFuseRoleHome(readFuseSession()?.role); }
export function getSessionTitle() { return getFuseRoleTitle(readFuseSession()?.role); }
