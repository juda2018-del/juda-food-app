"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/driver-app");
  }, [router]);

  return (
    <main dir="rtl" style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#050505",
      color: "#fff",
      fontFamily: "Cairo, system-ui, sans-serif"
    }}>
      جاري فتح تطبيق السائق...
    </main>
  );
}
