"use client";

import { useEffect } from "react";

/**
 * Legacy direct-order client removed — checkout must go through hardened /cart.
 * Kept as a redirect stub so accidental imports cannot revive weak pricing paths.
 */
export default function RestaurantOrderClient({ restaurant }: { restaurant: string }) {
  useEffect(() => {
    const id = encodeURIComponent(String(restaurant || "").trim().toLowerCase());
    window.location.replace(id ? `/restaurants/${id}/` : "/restaurants/");
  }, [restaurant]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#f4efe6",
        color: "#15171a",
        fontFamily: 'var(--fuse-body-font), "Tajawal", sans-serif',
        padding: 24,
        textAlign: "center",
      }}
    >
      <p>جاري التحويل إلى صفحة المطعم...</p>
    </main>
  );
}
