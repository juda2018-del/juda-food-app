"use client";

import { useEffect } from "react";

export default function KhanLegacyRedirect() {
  useEffect(() => {
    window.location.replace("/restaurants/khan/");
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
      <p>جاري التحويل إلى خان قدوري...</p>
    </main>
  );
}
