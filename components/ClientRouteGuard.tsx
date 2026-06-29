"use client";

import dynamic from "next/dynamic";

const RouteGuardNoSSR = dynamic(() => import("./RouteGuard"), {
  ssr: false,
  loading: () => null,
});

export default function ClientRouteGuard() {
  return <RouteGuardNoSSR />;
}
