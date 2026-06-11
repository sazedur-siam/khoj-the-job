import type { Metadata } from "next";
import Link from "next/link";
import { Poppins, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeToggle } from "./_components/ThemeToggle";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khoj · খোঁজ — IT Jobs in Bangladesh",
  description:
    "Aggregated IT, software engineering, and programmer jobs in Bangladesh from government circulars and 130+ private software companies.",
};

const THEME_INIT = `
(function(){try{
var t=localStorage.getItem('khoj-theme')||'system';
var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
if(d)document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} ${notoBengali.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <Link href="/" className="group flex items-baseline gap-2">
              <span
                className="font-[var(--font-display)] text-2xl leading-none tracking-tight text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Khoj
              </span>
              <span
                className="text-base leading-none text-[var(--foreground-subtle)] group-hover:text-[var(--accent)] transition"
                style={{ fontFamily: "var(--font-bengali)" }}
              >
                খোঁজ
              </span>
              <span className="ml-2 hidden text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] sm:inline">
                IT jobs · Bangladesh
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/sources"
                className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              >
                Sources
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-[var(--foreground-subtle)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              Khoj <span style={{ fontFamily: "var(--font-bengali)" }}>খোঁজ</span> — aggregating BD
              gov circulars + 130 software companies. Daily refresh.
            </div>
            <div className="flex gap-4">
              <span>Teletalk · BDJobs · BPSC · BANBEIS · ICTD · MoPA · BB</span>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
