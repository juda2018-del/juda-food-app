import Link from "next/link";
import type { ReactNode } from "react";
import FuseIcon from "@/components/FuseIcon";

type FuseBackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function FuseBackButton({
  href,
  label = "الرجوع",
  className = "back fuse-back-btn",
}: FuseBackButtonProps) {
  return (
    <Link href={href} className={className} aria-label={label}>
      <FuseIcon name="chevron-back" />
    </Link>
  );
}

type FuseIconButtonProps = {
  href?: string;
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

export function FuseIconButton({
  href,
  label,
  onClick,
  children,
  className = "icon-btn fuse-icon-btn",
}: FuseIconButtonProps) {
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
