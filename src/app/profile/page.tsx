import { ChevronRight, Lock, Shield, User } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";

const rows = [
  { label: "Account details", hint: "Name, email, phone", icon: User },
  { label: "Security", hint: "Password, 2FA, devices", icon: Shield },
  { label: "Privacy & data", hint: "Preferences and export", icon: Lock },
] as const;

export default function ProfilePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
          Account settings · Demo only
        </p>
      </div>

      <DemoBanner compact />

      {/* Avatar card */}
      <div className="mx-card flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mx-primary-soft)] text-lg font-bold text-[var(--mx-primary)]">
          U
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--mx-text)]">Demo User</p>
          <p className="truncate text-sm text-[var(--mx-text-muted)]">
            No account connected
          </p>
        </div>
      </div>

      {/* Settings rows */}
      <div className="mx-card overflow-hidden divide-y divide-[var(--mx-border)]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-3 px-4 py-3.5 opacity-70 sm:px-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-[var(--mx-text-muted)]">
              <row.icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--mx-text)]">{row.label}</p>
              <p className="text-xs text-[var(--mx-text-muted)]">{row.hint}</p>
            </div>
            <ChevronRight size={18} className="text-[var(--mx-text-soft)]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <strong className="font-semibold">Security note:</strong> Authentication, KYC, and
        account management are not enabled in this demo. Do not enter real credentials.
      </div>
    </div>
  );
}
