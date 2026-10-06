"use client";

import { useEffect } from "react";

/** Static-export safe redirect — preserves phone/orderId query params. */
export default function OrdersLegacyRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phone = params.get("phone")?.trim();
    const orderId = (params.get("orderId") || params.get("order"))?.trim();
    const next = new URLSearchParams();
    if (phone) next.set("phone", phone);
    if (orderId) next.set("orderId", orderId);
    const query = next.toString();
    window.location.replace(query ? `/order-status/?${query}` : "/order-status/");
  }, []);

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
      <p>جاري التحويل إلى تتبع الطلب...</p>
    </main>
  );
}
