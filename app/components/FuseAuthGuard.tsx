"use client";

import type { ReactNode } from "react";

type FuseAuthGuardProps = {
  children: ReactNode;
  [key: string]: unknown;
};

/**
 * FUSE LEGACY GUARD DISABLED
 * هذا الملف متعمد يكون Pass-through فقط.
 * لا window.location.replace
 * لا /login?next redirect
 * الحماية النظيفة صارت من:
 * components/auth/ClientRouteGuard.tsx
 * components/auth/FirebaseRouteGuard.tsx
 * app/restaurant-admin/layout.tsx
 */
export function FuseAuthGuard({ children }: FuseAuthGuardProps): ReactNode {
  return children;
}

export const ClientAuthGuard = FuseAuthGuard;
export const RouteGuard = FuseAuthGuard;
export const AuthGuard = FuseAuthGuard;
export const RestaurantGuard = FuseAuthGuard;
export const RestaurantAuthGuard = FuseAuthGuard;
export const AdminGuard = FuseAuthGuard;
export const AdminAuthGuard = FuseAuthGuard;

export default FuseAuthGuard;
