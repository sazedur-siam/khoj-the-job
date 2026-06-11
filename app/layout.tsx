import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Bengali, Poppins } from "next/font/google";
import Link from "next/link";
import { NavProgress } from "./_components/NavProgress";
import { ThemeToggle } from "./_components/ThemeToggle";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Khoj · খোঁজ — IT Jobs in Bangladesh",
    template: "%s",
  },
  description:
    "Aggregated IT, software engineering, and programmer jobs in Bangladesh from government circulars and 130+ private software companies.",
  openGraph: {
    siteName: "Khoj · খোঁজ",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavProgress />
        <header className="sticky top-0 z-30 border-b border-border bg-(--background)/85 backdrop-blur supports-[backdrop-filter]:bg-(--background)/70">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <Link href="/" className="group flex items-baseline gap-2">
              <span
                className="text-2xl leading-none tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Khoj
              </span>
              <span
                className="text-base leading-none text-foreground-subtle group-hover:text-accent transition"
                style={{ fontFamily: "var(--font-bengali)" }}
              >
                খোঁজ
              </span>
              <span className="ml-2 hidden text-xs uppercase tracking-[0.18em] text-foreground-subtle sm:inline">
                IT jobs · Bangladesh
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/sources"
                className="text-xs uppercase tracking-[0.18em] text-foreground-subtle hover:text-foreground"
              >
                Sources
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-foreground-subtle sm:flex-row sm:items-center sm:justify-between">
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
        <SpeedInsights />
      </body>
    </html>
  );
}
