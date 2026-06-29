import { Suspense } from "react";
import CustomerClient from "./CustomerClient";

export default function CustomerPage() {
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
          جاري تحميل صفحة الزبون...
        </main>
      }
    >
      <CustomerClient />
    </Suspense>
  );
}
