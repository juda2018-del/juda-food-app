import type { ReactNode } from "react";

export function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B0B0B] p-5 shadow-[0_0_35px_rgba(255,122,0,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default Card;
