import type { ReactNode } from "react";

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-14 items-center justify-between border-b-2 border-border px-4 md:px-6">
      <span className="font-heading text-lg font-bold">Chronicle</span>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
