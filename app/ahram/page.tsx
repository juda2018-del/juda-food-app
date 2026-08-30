"use client";

import { useEffect } from "react";

/** Legacy alias — ahram storefront now routes to شلتتة. */
export default function AhramLegacyRedirect() {
  useEffect(() => {
    window.location.replace("/restaurants/shalteta/");
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
      <p>جاري التحويل إلى مطعم شلتتة...</p>
    </main>
  );
}
