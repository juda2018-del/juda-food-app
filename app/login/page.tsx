import { Suspense } from "react";
import LoginClient from "./LoginClient";
import SessionStorageBridge from "./SessionStorageBridge";

export default function LoginPage() {
  return (
    <>
      <SessionStorageBridge />
      <Suspense
        fallback={
          <main className="fuse-auth-page" dir="rtl">
            <section className="fuse-auth-card">
              <p className="fuse-auth-message">جاري تحميل دخول FUSE...</p>
            </section>
          </main>
        }
      >
        <LoginClient />
      </Suspense>
    </>
  );
}
