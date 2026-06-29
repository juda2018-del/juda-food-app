"use client";

import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export default function FuseAuthGuard({ children }: Props) {
  return <>{children ?? null}</>;
}

export function AuthGuard({ children }: Props) {
  return <>{children ?? null}</>;
}
