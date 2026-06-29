import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
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
          جاري تحميل دخول فيوز...
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
