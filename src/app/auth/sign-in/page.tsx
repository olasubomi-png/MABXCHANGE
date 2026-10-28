"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { DemoBanner } from "@/components/demo-banner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Unable to sign in. Check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--mx-primary)] text-lg font-black text-white">
          M
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mx-text)]">
          Sign in
        </h1>
        <p className="mt-1.5 text-sm text-[var(--mx-text-muted)]">
          Access your MABXCHANGE demo account
        </p>
      </div>

      <DemoBanner compact />

      <form onSubmit={handleSubmit} className="mx-card space-y-4 p-5">
        {error && (
          <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--mx-text)]">
            Email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mx-text-soft)]"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/20"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--mx-text)]">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mx-text-soft)]"
            />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-white py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/20"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--mx-primary)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--mx-primary-hover)] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--mx-text-muted)]">
        No account yet?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-[var(--mx-primary)] hover:underline"
        >
          Create one
        </Link>
      </p>

      <p className="text-center text-xs text-[var(--mx-text-soft)]">
        Demo environment · No real funds or live trading
      </p>
    </div>
  );
}
