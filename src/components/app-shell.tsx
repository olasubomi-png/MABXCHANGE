"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Home,
  LineChart,
  List,
  User,
} from "lucide-react";
import { BrandMark } from "./brand-mark";
import { DemoBanner } from "./demo-banner";
import { LiveStatusBadge } from "./live-market-provider";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/trade", label: "Trade", icon: ArrowLeftRight },
  { href: "/activity", label: "Activity", icon: List },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--mx-bg)]">
      {!isAuthRoute && (
        <header className="sticky top-0 z-40 border-b border-[var(--mx-border)] bg-[var(--mx-surface)]/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4 sm:max-w-2xl sm:px-6">
            <BrandMark size="sm" showWordmark href="/" />
            <span className="rounded-full bg-[var(--mx-warning-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--mx-warning)] ring-1 ring-[var(--mx-warning)]/30">
              Demo
            </span>
          </div>
          <DemoBanner />
        </header>
      )}

      <main
        className={`mx-auto w-full max-w-lg flex-1 px-4 pt-5 sm:max-w-2xl sm:px-6 ${
          isAuthRoute
            ? "pb-8"
            : "pb-[calc(var(--nav-height)+var(--safe-bottom)+1rem)]"
        }`}
      >
        {children}
      </main>

      {!isAuthRoute && (
        <nav
          className="mx-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--mx-border)] bg-[var(--mx-surface)]/95 backdrop-blur-md"
          aria-label="Main"
        >
          <div className="mx-auto flex h-[var(--nav-height)] max-w-lg items-stretch sm:max-w-2xl">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                    active
                      ? "text-[var(--mx-primary)]"
                      : "text-[var(--mx-text-soft)] hover:text-[var(--mx-text-muted)]"
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 2}
                    absoluteStrokeWidth={false}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
