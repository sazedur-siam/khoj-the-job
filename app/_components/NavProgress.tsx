"use client";

import { useEffect, useState } from "react";

export const NAV_PROGRESS_EVENT = "khoj:nav-progress";

interface NavProgressEvent extends CustomEvent<{ pending: boolean }> {}

export function emitNavProgress(pending: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NAV_PROGRESS_EVENT, { detail: { pending } }) as NavProgressEvent
  );
}

export function NavProgress() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function onEvent(e: Event) {
      const ce = e as NavProgressEvent;
      setPending(Boolean(ce.detail?.pending));
    }
    window.addEventListener(NAV_PROGRESS_EVENT, onEvent);
    return () => window.removeEventListener(NAV_PROGRESS_EVENT, onEvent);
  }, []);

  return (
    <div
      aria-hidden={!pending}
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="khoj-progress-bar h-full w-full" />
      <style>{`
        .khoj-progress-bar {
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--accent) 30%,
            var(--accent) 70%,
            transparent 100%
          );
          background-size: 50% 100%;
          background-repeat: no-repeat;
          animation: khoj-progress 1.1s ease-in-out infinite;
        }
        @keyframes khoj-progress {
          0%   { background-position: -50% 0; }
          100% { background-position: 150% 0; }
        }
      `}</style>
    </div>
  );
}
