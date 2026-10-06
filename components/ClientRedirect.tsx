"use client";

import { useEffect } from "react";

type ClientRedirectProps = {
  href: string;
  message?: string;
  dark?: boolean;
};

/** Static-export safe client navigation (Next.js `redirect()` is unreliable with `output: 'export'`). */
export default function ClientRedirect({
  href,
  message = "جاري التحويل...",
  dark = false,
}: ClientRedirectProps) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: dark ? "#0f1115" : "#f4efe6",
        color: dark ? "#fff" : "#15171a",
        fontFamily: 'var(--fuse-body-font), "Tajawal", sans-serif',
        padding: 24,
        textAlign: "center",
      }}
    >
      <p>{message}</p>
    </main>
  );
}
