/**
 * Optional notice for features that are not yet funded/live.
 * Market prices are real; this is not used to imply fake market data.
 */
export function FeatureNotice({
  compact = false,
  children,
}: {
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const text =
    children ??
    "Trading, deposits, and withdrawals are not enabled yet. Market prices are live.";

  if (compact) {
    return (
      <div className="mx-banner-info flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--mx-border)] bg-[var(--mx-primary-soft)] px-4 py-2 text-center text-xs text-[var(--mx-text-muted)] sm:text-sm">
      {text}
    </div>
  );
}

/** @deprecated Use FeatureNotice — kept for import compatibility during migration */
export function DemoBanner(props: { compact?: boolean }) {
  return <FeatureNotice compact={props.compact} />;
}
