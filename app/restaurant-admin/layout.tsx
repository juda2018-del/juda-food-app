import type { ReactNode } from "react";
import FirebaseRouteGuard from "@/components/auth/FirebaseRouteGuard";

export default function RestaurantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <FirebaseRouteGuard>{children}</FirebaseRouteGuard>;
}
