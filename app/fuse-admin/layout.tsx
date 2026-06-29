import type { ReactNode } from "react";
import FuseAdminBridge from "./FuseAdminBridge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FuseAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <FuseAdminBridge>{children}</FuseAdminBridge>;
}
