export type FuseRole = "admin" | "restaurant" | "driver" | "customer";

export type FuseSession = {
  uid?: string;
  email: string;
  name?: string;
  phone?: string;
  role: FuseRole;
  restaurantId?: string;
  restaurantName?: string;
  createdAt?: number;
};

export const FUSE_LOCAL_SESSION = "fuse_local_session";

export const FUSE_COOKIE_ROLE = "fuse_role";
export const FUSE_COOKIE_EMAIL = "fuse_email";
export const FUSE_COOKIE_NAME = "fuse_name";
export const FUSE_COOKIE_PHONE = "fuse_phone";
export const FUSE_COOKIE_RESTAURANT = "fuse_restaurant";

export const roleHome: Record<FuseRole, string> = {
  admin: "/fuse-admin",
  restaurant: "/restaurant-admin",
  driver: "/driver",
  customer: "/customer",
};

export const roleTitle: Record<FuseRole, string> = {
  admin: "إدارة فيوز",
  restaurant: "إدارة المطعم",
  driver: "السائق",
  customer: "الزبون",
};

export function parseFuseRole(value: unknown): FuseRole | null {
  if (!value) return null;

  const role = String(value).trim().toLowerCase();

  if (role === "admin" || role === "fuse-admin" || role === "fuse_admin") {
    return "admin";
  }

  if (
    role === "restaurant" ||
    role === "restaurant-admin" ||
    role === "restaurant_admin"
  ) {
    return "restaurant";
  }

  if (role === "driver") {
    return "driver";
  }

  if (role === "customer" || role === "user") {
    return "customer";
  }

  return null;
}

export function isFuseRole(value: unknown): value is FuseRole {
  return parseFuseRole(value) !== null;
}

export function getFuseRoleHome(role: unknown) {
  const parsed = parseFuseRole(role);
  return parsed ? roleHome[parsed] : "/login";
}

export function getFuseRoleTitle(role: unknown) {
  const parsed = parseFuseRole(role);
  return parsed ? roleTitle[parsed] : "فيوز";
}

export function readFuseSession(): FuseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FUSE_LOCAL_SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FuseSession>;
    const role = parseFuseRole(parsed.role);

    if (!parsed.email || !role) return null;

    return {
      uid: parsed.uid,
      email: parsed.email,
      name: parsed.name,
      phone: parsed.phone,
      role,
      restaurantId: parsed.restaurantId,
      restaurantName: parsed.restaurantName,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function saveFuseSession(session: FuseSession) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(FUSE_LOCAL_SESSION, JSON.stringify(session));
}

export function clearFuseSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(FUSE_LOCAL_SESSION);

  const cookies = [
    FUSE_COOKIE_ROLE,
    FUSE_COOKIE_EMAIL,
    FUSE_COOKIE_NAME,
    FUSE_COOKIE_PHONE,
    FUSE_COOKIE_RESTAURANT,
  ];

  for (const name of cookies) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}