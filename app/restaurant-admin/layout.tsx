import type { ReactNode } from "react";
import { Suspense } from "react";
import RestaurantAdminGate from "./RestaurantAdminGate";
import RestaurantLiveOrdersPanel from "./RestaurantLiveOrdersPanel";

export default function RestaurantAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RestaurantAdminGate>
        <RestaurantLiveOrdersPanel />
        {children}
      </RestaurantAdminGate>
    </Suspense>
  );
}
