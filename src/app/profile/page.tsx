import Link from "next/link";
import { ChevronRight, Lock, Shield, User } from "lucide-react";
import { auth } from "@/lib/auth/server";
import { ensureAppUser, getCustomerAccountForUser } from "@/lib/db";
import { DemoBanner } from "@/components/demo-banner";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

const settingsRows = [
  { label: "Account details", hint: "Name, email", icon: User, href: "#" },
  { label: "Security", hint: "Password, sessions", icon: Shield, href: "#" },
  { label: "Privacy & data", hint: "Preferences and export", icon: Lock, href: "#" },
] as const;

export default async function ProfilePage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">Profile</h1>
          <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
            Sign in to view your account
          </p>
        </div>
        <DemoBanner compact />
        <div className="mx-card space-y-4 p-6 text-center">
          <p className="text-sm text-[var(--mx-text-muted)]">
            You are not signed in.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/auth/sign-in"
              className="rounded-xl bg-[var(--mx-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-xl border border-[var(--mx-border)] px-4 py-2.5 text-sm font-medium text-[var(--mx-text)]"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let appUser = null;
  let account = null;
  try {
    appUser = await ensureAppUser({
      authUserId: session.user.id,
      email: session.user.email ?? "",
      displayName: session.user.name,
    });
    if (appUser?.id) {
      account = await getCustomerAccountForUser(String(appUser.id));
    }
  } catch {
    // DB may be unreachable; fall back gracefully
  }

  const displayName =
    appUser?.display_name ||
    session.user.name ||
    session.user.email?.split("@")[0] ||
    "User";
  const email = appUser?.email || session.user.email || "—";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
          Account settings · Demo only
        </p>
      </div>

      <DemoBanner compact />

      <div className="mx-card flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mx-primary-soft)] text-lg font-bold text-[var(--mx-primary)]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--mx-text)]">{displayName}</p>
          <p className="truncate text-sm text-[var(--mx-text-muted)]">{email}</p>
          {account ? (
            <p className="mt-1 text-xs text-[var(--mx-text-soft)]">
              Account status: {String(account.status ?? "sandbox")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--mx-text-soft)]">
              Sandbox account · setup incomplete
            </p>
          )}
        </div>
      </div>

      <div className="mx-card overflow-hidden">
        {settingsRows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < settingsRows.length - 1 ? "border-b border-[var(--mx-border)]" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mx-bg-muted)]">
                <Icon size={16} className="text-[var(--mx-text-muted)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--mx-text)]">{row.label}</p>
                <p className="text-xs text-[var(--mx-text-soft)]">{row.hint}</p>
              </div>
              <ChevronRight size={16} className="text-[var(--mx-text-soft)]" />
            </div>
          );
        })}
      </div>

      <div className="mx-card p-4">
        <SignOutButton />
      </div>

      <p className="text-center text-xs text-[var(--mx-text-soft)]">
        Authentication is provided by Neon Managed Auth. Financial activity remains sandbox-only.
      </p>
    </div>
  );
}
