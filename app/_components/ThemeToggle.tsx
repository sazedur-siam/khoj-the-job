"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "khoj-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(KEY) as Theme) || "system";
    setTheme(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(KEY, theme);
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, mounted]);

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☼" },
    { value: "system", label: "System", icon: "⌂" },
    { value: "dark", label: "Dark", icon: "☾" },
  ];

  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-xs">
      {options.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={`${opt.label} theme`}
            onClick={() => setTheme(opt.value)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
              active
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
            }`}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
