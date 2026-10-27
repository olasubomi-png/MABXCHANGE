import { Greeting } from "@/components/greeting";
import { BalanceCard } from "@/components/balance-card";
import { ActionGrid } from "@/components/action-grid";
import { HoldingsList } from "@/components/holdings-list";

export default function HomePage() {
  return (
    <div className="space-y-5">
      <Greeting />
      <BalanceCard />
      <ActionGrid />
      <HoldingsList />
      <p className="pb-2 text-center text-xs text-[var(--mx-text-soft)]">
        MABXCHANGE demo · Not a live trading platform
      </p>
    </div>
  );
}
