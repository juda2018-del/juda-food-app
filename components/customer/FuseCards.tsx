import Link from "next/link";
import type { ReactNode } from "react";

type FuseCardProps = {
  children: ReactNode;
  className?: string;
};

export function FuseCard({ children, className = "" }: FuseCardProps) {
  return <section className={`fuse-card form-card ${className}`.trim()}>{children}</section>;
}

type FusePrimaryButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FusePrimaryButton({
  children,
  href,
  type = "button",
  disabled,
  onClick,
  className = "fuse-primary-btn btn-primary",
}: FusePrimaryButtonProps) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

type FuseSecondaryButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function FuseSecondaryButton({
  children,
  href,
  type = "button",
  disabled,
  onClick,
  className = "fuse-secondary-btn btn-secondary",
}: FuseSecondaryButtonProps) {
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

type FuseStateCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "loading" | "empty" | "error";
  className?: string;
};

export function FuseStateCard({
  title,
  description,
  action,
  tone = "default",
  className = "",
}: FuseStateCardProps) {
  const toneClass =
    tone === "loading"
      ? "fuse-state-card--loading"
      : tone === "empty"
        ? "fuse-state-card--empty"
        : tone === "error"
          ? "fuse-state-card--error"
          : "";

  return (
    <section className={`fuse-state-card ${toneClass} ${className}`.trim()}>
      <b>{title}</b>
      {description ? <p>{description}</p> : null}
      {action}
    </section>
  );
}
