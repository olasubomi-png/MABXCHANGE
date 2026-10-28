import Link from "next/link";
import { CheckCircle2, Copy, Gift, Sparkles } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { DemoLabel, PageHeader } from "@/components/ui";

export default function RewardsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Rewards" subtitle="Loyalty & referrals · Demo" />
      <DemoBanner compact />

      <div className="mx-card flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-[var(--mx-text-muted)]">Your rewards</p>
          <p className="mt-1 text-2xl font-bold text-[var(--mx-text)]">$0.00</p>
          <p className="mt-1 text-xs text-[var(--mx-success)]">+0.00%</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.15)] text-[#a78bfa]">
          <Gift size={28} />
        </div>
      </div>

      <div className="mx-card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-[var(--mx-text)]">
          Referral program
        </h2>
        <p className="text-sm text-[var(--mx-text-muted)]">
          Invite friends and earn rewards when the program is enabled. Codes
          shown here are demo placeholders.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5">
          <code className="flex-1 text-sm font-medium text-[var(--mx-text)]">
            MABX123456
          </code>
          <Copy size={16} className="text-[var(--mx-text-soft)]" />
        </div>
        <button
          type="button"
          className="mx-btn mx-btn-primary w-full"
          disabled
        >
          Share link (coming soon)
        </button>
      </div>

      <div className="mx-card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-[var(--mx-text)]">
          How it works
        </h2>
        {[
          "Share your referral link",
          "Your friend signs up",
          "You both earn rewards",
        ].map((step) => (
          <div key={step} className="flex items-center gap-2 text-sm text-[var(--mx-text-muted)]">
            <CheckCircle2 size={16} className="text-[var(--mx-success)]" />
            {step}
          </div>
        ))}
      </div>

      <div className="mx-card flex flex-col items-center px-6 py-10 text-center">
        <Sparkles size={28} className="text-[var(--mx-text-soft)]" />
        <p className="mt-3 text-sm text-[var(--mx-text-muted)]">
          Rewards engine is not connected. No real bonuses are issued.
        </p>
        <Link
          href="/markets"
          className="mx-btn mx-btn-primary mt-5 px-6"
        >
          Explore markets
        </Link>
      </div>
      <DemoLabel />
    </div>
  );
}
