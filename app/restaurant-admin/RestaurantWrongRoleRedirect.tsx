"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RestaurantWrongRoleRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const role =
      searchParams.get("fuseRole") ||
      searchParams.get("role") ||
      "";

    const email =
      searchParams.get("fuseEmail") ||
      searchParams.get("email") ||
      "";

    const cleanRole = role.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanRole === "driver" || cleanEmail === "driver@fuse.iq") {
      router.replace("/driver?fuseRole=driver&fuseEmail=driver%40fuse.iq");
      return;
    }

    if (cleanRole === "admin" || cleanEmail === "admin@fuse.iq") {
      router.replace("/fuse-admin");
      return;
    }

    if (cleanRole === "customer" || cleanEmail === "customer@fuse.iq") {
      router.replace("/customer?fuseRole=customer&fuseEmail=customer%40fuse.iq");
      return;
    }
  }, [router, searchParams]);

  return null;
}
