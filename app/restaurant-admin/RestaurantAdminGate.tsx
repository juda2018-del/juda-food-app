"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";
import { parseFuseRole, roleHome, saveFuseSession, type FuseRole } from "@/lib/fuse-auth";
import { resolveFuseSession } from "@/lib/fuse-session-resolve";

type GateState = "checking" | "allowed" | "redirecting";

const LOAD_TIMEOUT_MS = 8000;

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function targetForRole(role: FuseRole) {
  return roleHome[role];
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
    const parsedUrlRole = parseFuseRole(urlRole);
    if (parsedUrlRole && parsedUrlRole !== "restaurant") {
      setState("redirecting");
      router.replace(targetForRole(parsedUrlRole));
      return;
    }

    const timeout = window.setTimeout(() => {
      setState("redirecting");
      router.replace("/login?next=/restaurant-admin");
    }, LOAD_TIMEOUT_MS);

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      window.clearTimeout(timeout);

      if (!user) {
        setState("redirecting");
        router.replace("/login?next=/restaurant-admin");
        return;
      }

      try {
        const session = await resolveFuseSession(user);
        saveFuseSession(session);

        if (session.role === "restaurant") {
          setState("allowed");
          return;
        }

        setState("redirecting");
        router.replace(targetForRole(session.role));
      } catch {
        setState("redirecting");
        router.replace("/login?next=/restaurant-admin");
      }
    });

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
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
