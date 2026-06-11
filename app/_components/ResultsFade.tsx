"use client";

import type { ReactNode } from "react";
import { useNavPending } from "./NavProgress";

export function ResultsFade({ children }: { children: ReactNode }) {
  const pending = useNavPending();

  return (
    <div className="relative">
      <div
        className={`transition-opacity duration-150 ${
          pending ? "pointer-events-none opacity-40" : "opacity-100"
        }`}
        aria-busy={pending}
      >
        {children}
      </div>
      {pending && (
        <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted shadow-sm">
            <Spinner />
            Loading
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" style={{ color: "var(--accent)" }} />
    </svg>
  );
}
