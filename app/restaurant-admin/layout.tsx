import type { ReactNode } from "react";
import { Suspense } from "react";
import RestaurantAdminGate from "./RestaurantAdminGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
