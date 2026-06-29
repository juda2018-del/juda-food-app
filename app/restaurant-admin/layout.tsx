import type { ReactNode } from "react";
import { Suspense } from "react";
import RestaurantAdminGate from "./RestaurantAdminGate";

export default function RestaurantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RestaurantAdminGate>{children}</RestaurantAdminGate>
    </Suspense>
  );
}

