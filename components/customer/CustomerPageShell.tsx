import type { ReactNode } from "react";

type CustomerPageShellProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "phone" | "auth" | "reels" | "legal";
  pageClassName?: string;
};

export default function CustomerPageShell({
  children,
  className = "",
  variant = "default",
  pageClassName = "",
}: CustomerPageShellProps) {
  if (variant === "auth") {
    return (
      <main dir="rtl" className={`fuse-auth-page ${className}`.trim()}>
        {children}
      </main>
    );
  }

  if (variant === "reels") {
    return (
      <main dir="rtl" className={`page reels-page ${className}`.trim()}>
        {children}
      </main>
    );
  }

  if (variant === "legal") {
    return (
      <main dir="rtl" className={`customer-page fuse-legal-page ${className}`.trim()}>
        {children}
      </main>
    );
  }

  if (variant === "phone") {
    return (
      <main dir="rtl" className={`page ${pageClassName} ${className}`.trim()}>
        <section className="phone">{children}</section>
      </main>
    );
  }

  return (
    <main dir="rtl" className={`customer-page ${className}`.trim()}>
      {children}
    </main>
  );
}
