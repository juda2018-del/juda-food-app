"use client";

import type { ReactNode } from "react";
import ClientRouteGuard from "./ClientRouteGuard";
import type { FuseRole } from "@/lib/fuse-auth";

type FirebaseRouteGuardProps = {
  children: ReactNode;
  /** @deprecated Prefer allowedRoles. Email allowlists are ignored for authorization. */
  allowedEmails?: string[];
  allowedRoles?: FuseRole[];
};

const DEFAULT_ROLES: FuseRole[] = ["admin", "restaurant"];

export default function FirebaseRouteGuard({
  children,
  allowedEmails = [],
  allowedRoles = DEFAULT_ROLES,
}: FirebaseRouteGuardProps) {
  return (
    <ClientRouteGuard
      allowedEmails={allowedEmails}
      allowedRoles={allowedRoles}
      loginPath="/login"
      guardName="FUSE Firebase Route Guard"
    >
      {children}
    </ClientRouteGuard>
  );
}
