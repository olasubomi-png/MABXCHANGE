import { SUPPORTED_ASSETS } from "@/lib/assets";

export function HoldingsList() {
  return (
    <div className="mx-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--mx-border)] px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold text-[var(--mx-text)]">Holdings</h2>
        <span className="rounded-full bg-[var(--mx-surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--mx-text-muted)]">
          Demo
        </span>
      </div>
      <ul className="divide-y divide-[var(--mx-border)]">
        {SUPPORTED_ASSETS.map((asset) => (
          <li
            key={asset.symbol}
            className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
              style={{ backgroundColor: asset.color }}
              aria-hidden
            >
              {asset.mark}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--mx-text)]">
                {asset.name}
              </p>
              <p className="text-xs text-[var(--mx-text-muted)]">{asset.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--mx-text)]">—</p>
              <p className="text-xs text-[var(--mx-text-soft)]">No price</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 py-3 text-center text-xs text-[var(--mx-text-muted)] sm:px-5">
        Asset balances and market prices require a connected data source
      </div>
    </div>
  );
}
