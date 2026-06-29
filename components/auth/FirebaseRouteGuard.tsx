"use client";

import type { ReactNode } from "react";
import ClientRouteGuard from "./ClientRouteGuard";

type FirebaseRouteGuardProps = {
  children: ReactNode;
  allowedEmails?: string[];
};

const RESTAURANT_ADMIN_EMAILS = [
  "restaurant@fuse.iq",
  "admin@fuse.iq",
];

export default function FirebaseRouteGuard({
  children,
  allowedEmails = RESTAURANT_ADMIN_EMAILS,
}: FirebaseRouteGuardProps) {
  return (
    <ClientRouteGuard
      allowedEmails={allowedEmails}
      loginPath="/login"
      guardName="FUSE Firebase Route Guard"
    >
      {children}
    </ClientRouteGuard>
  );
}
