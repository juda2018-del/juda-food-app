 import { NextRequest, NextResponse } from "next/server";
import {
  FUSE_COOKIE_ROLE,
  parseFuseRole,
  roleHome,
  type FuseRole,
} from "./lib/fuse-auth";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/logout",
  "/favicon.ico",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
];

const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/images",
  "/sounds",
  "/icons",
  "/screenshots",
];

const ROLE_PATHS: Record<FuseRole, string[]> = {
  admin: [
    "/fuse-admin",
    "/mission-control",
    "/operations-center",
    "/reports",
    "/reports-live",
    "/live-orders",
    "/live-orders-now",
    "/live-tracking",
    "/live-map-tracking",
    "/restaurant-live",
    "/restaurant-intelligence",
    "/drivers-admin",
    "/driver-admin",
    "/ratings-admin",
    "/notification-center",
    "/notifications",
    "/fuse-command-live",
    "/fuse-copilot",
    "/fuse-gpt",
    "/fuse-map",
    "/fuse-os",
    "/fuse-universe",
    "/fuse-voice",
  ],

  restaurant: [
    "/restaurant-admin",
    "/restaurant-dashboard",
    "/restaurant-orders",
    "/restaurant-live",
    "/restaurant-intelligence",
    "/menu-live",
    "/live-orders",
    "/reports",
    "/reports-live",
    "/notification-center",
    "/notifications",
  ],

  driver: [
    "/driver",
    "/driver-admin",
    "/driver-earnings",
    "/live-tracking",
    "/live-map-tracking",
  ],

  customer: [
    "/customer",
    "/cart",
    "/orders",
    "/order-status",
    "/profile",
    "/ratings",
    "/restaurants",
    "/fayrouz",
    "/shalteta",
    "/khan",
  ],
};

function isPublicRoute(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiredRoleForPath(pathname: string): FuseRole | null {
  for (const role of Object.keys(ROLE_PATHS) as FuseRole[]) {
    if (ROLE_PATHS[role].some((prefix) => pathname.startsWith(prefix))) {
      return role;
    }
  }

  return null;
}

function readRole(request: NextRequest): FuseRole | null {
  const urlRole = request.nextUrl.searchParams.get("fuseRole");
  const cookieRole =
    request.cookies.get(FUSE_COOKIE_ROLE)?.value ||
    request.cookies.get("fuseRole")?.value ||
    request.cookies.get("role")?.value;

  return parseFuseRole(urlRole || cookieRole);
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function roleRedirect(request: NextRequest, role: FuseRole) {
  const url = request.nextUrl.clone();
  url.pathname = roleHome[role] || "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const requiredRole = requiredRoleForPath(pathname);

  if (!requiredRole) {
    return NextResponse.next();
  }

  const currentRole = readRole(request);

  if (!currentRole) {
    return loginRedirect(request);
  }

  if (currentRole !== requiredRole) {
    return roleRedirect(request, currentRole);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};