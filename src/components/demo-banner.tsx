import { Info } from "lucide-react";

export function DemoBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <Info size={14} className="shrink-0" />
        <span>Demo UI only — no live balances or transactions</span>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 sm:text-sm">
      <span className="font-medium">Demo UI only</span>
      <span className="mx-1.5 text-amber-400">·</span>
      No real balances, deposits, withdrawals, or trades are connected
    </div>
  );
}
