import { Suspense } from "react";
import DriverClient from "./DriverClient";

export default function DriverPage() {
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
          جاري تحميل لوحة السائق...
        </main>
      }
    >
      <DriverClient />
    </Suspense>
  );
}
