"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Repeat2, X } from "lucide-react";

const actions = [
  {
    id: "deposit",
    label: "Deposit",
    icon: ArrowDownToLine,
    color: "bg-[var(--mx-success-soft)] text-[var(--mx-success)]",
  },
  {
    id: "trade",
    label: "Trade",
    icon: ArrowLeftRight,
    color: "bg-[var(--mx-primary-soft)] text-[var(--mx-primary)]",
  },
  {
    id: "swap",
    label: "Swap",
    icon: Repeat2,
    color: "bg-[rgba(139,92,246,0.15)] text-[#a78bfa]",
  },
  {
    id: "send",
    label: "Send",
    icon: ArrowUpRight,
    color: "bg-[var(--mx-warning-soft)] text-[var(--mx-warning)]",
  },
] as const;

export function ActionGrid() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpen(a.id)}
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
          </button>
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
              <div>
                <h3 className="text-lg font-bold text-[var(--mx-text)]">
                  {actions.find((a) => a.id === open)?.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
                  Unavailable in demo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-full p-1.5 text-[var(--mx-text-muted)] hover:bg-[var(--mx-surface-2)]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--mx-text-muted)]">
              This action is not connected to a live backend. Deposits, trades,
              swaps, and sends remain disabled until custody, ledger, and
              provider integrations are in place.
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
