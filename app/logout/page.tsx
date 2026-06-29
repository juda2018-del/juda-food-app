import { Suspense } from "react";
import LogoutClient from "./LogoutClient";

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <main style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#050505",
          color: "#fff",
          fontFamily: "Cairo, system-ui, sans-serif"
        }}>
          جاري تسجيل الخروج من فيوز...
        </main>
      }
    >
      <LogoutClient />
    </Suspense>
  );
}
