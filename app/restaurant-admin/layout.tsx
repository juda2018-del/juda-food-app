import type { ReactNode } from "react";
import { Suspense } from "react";
import FirebaseRouteGuard from "@/components/auth/FirebaseRouteGuard";
import RestaurantWrongRoleRedirect from "./RestaurantWrongRoleRedirect";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RestaurantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FirebaseRouteGuard>
      <Suspense fallback={null}>
        <RestaurantWrongRoleRedirect />
      </Suspense>
      {children}
    </FirebaseRouteGuard>
  );
}
