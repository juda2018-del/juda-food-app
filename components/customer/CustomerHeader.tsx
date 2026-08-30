import type { ReactNode } from "react";
import Link from "next/link";
import FuseIcon from "@/components/FuseIcon";

type CustomerHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export default function CustomerHeader({
  title,
  subtitle,
  backHref,
  backLabel = "الرجوع",
  left,
  right,
  className = "",
}: CustomerHeaderProps) {
  const back =
    left ??
    (backHref ? (
      <Link href={backHref} className="back fuse-back-btn" aria-label={backLabel}>
        <FuseIcon name="chevron-back" />
      </Link>
    ) : (
      <div className="customer-header__space space" aria-hidden="true" />
    ));

  return (
    <header className={`customer-header top ${className}`.trim()}>
      {back}
      <div className="customer-header__title title">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right ?? <div className="customer-header__space space" aria-hidden="true" />}
    </header>
  );
}
