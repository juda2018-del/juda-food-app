"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

type GateState = "checking" | "allowed" | "redirecting";

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function roleFromEmail(email: string) {
  const clean = normalize(email);

  if (clean === "admin@fuse.iq") return "admin";
  if (clean === "restaurant@fuse.iq") return "restaurant";
  if (clean === "driver@fuse.iq") return "driver";
  if (clean === "customer@fuse.iq") return "customer";

  return "";
}

function targetForRole(role: string) {
  if (role === "driver") return "/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq";
  if (role === "admin") return "/fuse-admin";
  if (role === "customer") return "/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq";
  return "";
}

export default function RestaurantAdminGate({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<GateState>("checking");

  const urlRole = useMemo(() => {
    return normalize(searchParams.get("fuseRole") || searchParams.get("role"));
  }, [searchParams]);

  const urlEmail = useMemo(() => {
    return normalize(searchParams.get("fuseEmail") || searchParams.get("email"));
  }, [searchParams]);

  useEffect(() => {
    const roleFromUrl = urlRole || roleFromEmail(urlEmail);
    const urlTarget = targetForRole(roleFromUrl);

    if (urlTarget) {
      setState("redirecting");
      router.replace(urlTarget);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      const email = normalize(user?.email);
      const role = roleFromEmail(email);

      if (!email) {
        setState("redirecting");
        router.replace("/login?next=/restaurant-admin");
        return;
      }

      if (role === "driver" || role === "customer") {
        setState("redirecting");
        router.replace(targetForRole(role));
        return;
      }

      if (role === "admin") {
        setState("redirecting");
        router.replace("/fuse-admin");
        return;
      }

      if (role === "restaurant") {
        setState("allowed");
        return;
      }

      setState("redirecting");
      router.replace("/login?next=/restaurant-admin");
    });

    return () => unsubscribe();
  }, [router, urlRole, urlEmail]);

  if (state !== "allowed") {
    return (
      <main dir="rtl" style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#050505",
        color: "#fff",
        fontFamily: "Cairo, system-ui, sans-serif",
        padding: 24
      }}>
        <section style={{
          width: "min(520px, 100%)",
          border: "1px solid rgba(255,122,0,0.28)",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 24,
          padding: 28,
          textAlign: "center"
        }}>
          <p style={{ margin: 0, color: "#FF7A00", fontWeight: 900 }}>
            FUSE Role Gate
          </p>
          <h1 style={{ margin: "12px 0", fontSize: 28 }}>
            جاري توجيه الحساب الصحيح...
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.8 }}>
            إذا الحساب سائق أو أدمن أو زبون، ما راح نعرض لوحة المطعم.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
