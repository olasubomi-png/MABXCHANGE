"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Gift,
  X,
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
    id: "rewards",
    label: "Rewards",
    icon: Gift,
    href: "/rewards",
    color: "bg-[rgba(139,92,246,0.15)] text-[#a78bfa]",
  },
] as const;

export function ActionGrid() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--mx-border)] bg-[var(--mx-surface)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-[var(--mx-text)]">
                Unavailable
              </h3>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-full p-1.5 text-[var(--mx-text-muted)] hover:bg-[var(--mx-surface-2)]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--mx-text-muted)]">
              This action is sandbox-only and not connected to live systems.
            </p>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mx-btn mx-btn-primary mt-5 w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
