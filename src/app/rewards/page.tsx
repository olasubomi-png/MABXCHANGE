import { Gift, Sparkles } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";

export default function RewardsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">Rewards</h1>
        <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
          Loyalty and referral programs · Coming soon
        </p>
      </div>

      <DemoBanner compact />

      <div className="mx-card flex flex-col items-center px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          <Gift size={32} strokeWidth={1.75} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-[var(--mx-text)]">
          Rewards not available
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--mx-text-muted)]">
          Referral bonuses, trading cashback, and loyalty tiers will appear here once the rewards
          engine is connected. This section is a placeholder in the demo UI.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-[var(--mx-surface-2)] px-4 py-2 text-xs font-medium text-[var(--mx-text-muted)]">
          <Sparkles size={14} />
          Demo placeholder
        </div>
      </div>
    </div>
  );
}
