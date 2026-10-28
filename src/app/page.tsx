import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { Greeting } from "@/components/greeting";
import { BalanceCard } from "@/components/balance-card";
import { ActionGrid } from "@/components/action-grid";
import { HoldingsList } from "@/components/holdings-list";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

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
