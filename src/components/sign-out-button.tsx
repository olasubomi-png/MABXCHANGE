"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await authClient.signOut();
      router.push("/auth/sign-in");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--mx-danger)]/40 bg-[var(--mx-danger-soft)] py-2.5 text-sm font-medium text-[var(--mx-danger)] transition hover:bg-[rgba(255,77,94,0.2)] disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
