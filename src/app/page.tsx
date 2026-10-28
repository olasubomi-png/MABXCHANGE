import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  getInitials,
  provisionAuthenticatedUser,
} from "@/lib/db";
import { Greeting } from "@/components/greeting";
import { BalanceCard } from "@/components/balance-card";
import { ActionGrid } from "@/components/action-grid";
import { HoldingsList } from "@/components/holdings-list";
import { LiveTickerStrip } from "@/components/live-ticker-strip";
import { DemoLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { appUser, dbError } = await provisionAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  const displayName =
    session.user.name ||
    session.user.email?.split("@")[0] ||
    null;

  const initials = getInitials(displayName);

  return (
    <div className="space-y-5">
      <Greeting displayName={displayName} initials={initials} />

      {dbError && (
        <div className="rounded-xl mx-banner-warning px-3.5 py-2.5 text-sm">
          Account data is temporarily unavailable. You are still signed in.
        </div>
      )}

      <BalanceCard />
      <ActionGrid />
      <LiveTickerStrip />
      <HoldingsList />
      <DemoLabel />
    </div>
  );
}
