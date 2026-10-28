"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Gift,
  Repeat2,
} from "lucide-react";

const actions = [
  {
    id: "deposit",
    label: "Deposit",
    icon: ArrowDownToLine,
    href: "/wallet",
    color: "bg-[var(--mx-success-soft)] text-[var(--mx-success)]",
  },
  {
    id: "trade",
    label: "Trade",
    icon: ArrowLeftRight,
    href: "/trade",
    color: "bg-[var(--mx-primary-soft)] text-[var(--mx-primary)]",
  },
  {
    id: "swap",
    label: "Swap",
    icon: Repeat2,
    href: "/swap",
    color: "bg-[rgba(139,92,246,0.15)] text-[#a78bfa]",
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    href: "/rewards",
    color: "bg-[var(--mx-warning-soft)] text-[var(--mx-warning)]",
  },
] as const;

export function ActionGrid() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--mx-border)] bg-[var(--mx-surface)] p-3 shadow-sm transition active:scale-[0.97] hover:border-[var(--mx-border-strong)] hover:bg-[var(--mx-surface-2)]"
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.color}`}
          >
            <a.icon size={20} strokeWidth={2.25} />
          </span>
          <span className="text-xs font-semibold text-[var(--mx-text)]">
            {a.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
