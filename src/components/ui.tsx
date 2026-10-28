import { type ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--mx-text-muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "completed" | "pending" | "failed" | "verified" | "sandbox";
}) {
  const styles: Record<string, string> = {
    completed: "bg-[var(--mx-success-soft)] text-[var(--mx-success)]",
    pending: "bg-[var(--mx-warning-soft)] text-[var(--mx-warning)]",
    failed: "bg-[var(--mx-danger-soft)] text-[var(--mx-danger)]",
    verified: "bg-[var(--mx-success-soft)] text-[var(--mx-success)]",
    sandbox: "bg-[var(--mx-warning-soft)] text-[var(--mx-warning)]",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.sandbox}`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-card flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--mx-surface-2)] text-[var(--mx-text-soft)]">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--mx-text)]">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-[var(--mx-text-muted)]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DemoLabel({ children }: { children?: ReactNode }) {
  return (
    <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
      {children ?? "Demo UI · Sample data only · Not live trading"}
    </p>
  );
}
