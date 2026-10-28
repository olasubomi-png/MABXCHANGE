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
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
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
