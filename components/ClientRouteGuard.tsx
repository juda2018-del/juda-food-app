"use client";

import dynamic from "next/dynamic";

const RouteGuard = dynamic(() => import("./RouteGuard"), { ssr: false });

export default function ClientRouteGuard() {
  return <RouteGuard />;
}
