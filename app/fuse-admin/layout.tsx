import type { ReactNode } from "react";
import FuseAdminBridge from "./FuseAdminBridge";

export default function FuseAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <FuseAdminBridge>{children}</FuseAdminBridge>;
}
