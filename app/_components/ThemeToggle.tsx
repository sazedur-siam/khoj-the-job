"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "khoj-theme";
const THEME_CHANGE_EVENT = "khoj:theme-change";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function readTheme(): Theme {
  const v = localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function subscribe(onChange: () => void): () => void {
  const handler = () => {
    applyTheme(readTheme());
    onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// Server snapshot: no theme known yet, so no option renders as active during SSR.
const getServerTheme = () => null;

function setTheme(next: Theme) {
  localStorage.setItem(KEY, next);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☼" },
  { value: "system", label: "System", icon: "⌂" },
  { value: "dark", label: "Dark", icon: "☾" },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, readTheme, getServerTheme);

  // While in system mode, follow OS theme changes live.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={`${opt.label} theme`}
            onClick={() => setTheme(opt.value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
              active
                ? "bg-foreground text-background"
                : "text-foreground-subtle hover:text-foreground"
            }`}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
