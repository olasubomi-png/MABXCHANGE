export function DemoBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="mx-banner-warning flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
        <span className="font-semibold">Demo UI only</span>
        <span className="opacity-80">· No real balances or live trades</span>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--mx-border)] bg-[var(--mx-warning-soft)] px-4 py-2.5 text-center text-xs text-[var(--mx-warning)] sm:text-sm">
      <span className="font-semibold">Demo UI only</span>
      <span className="opacity-90">
        {" "}
        · Market figures are illustrative · Real-money transactions are disabled
      </span>
    </div>
  );
}
