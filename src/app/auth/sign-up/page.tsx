"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { DemoBanner } from "@/components/demo-banner";
import { BrandMark } from "@/components/brand-mark";
import { BrandLoader } from "@/components/brand-loader";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim() || email.split("@")[0],
      });

      if (signUpError) {
        setError(signUpError.message || "Unable to create account. Try a different email.");
        setLoading(false);
        return;
      }

      const target = callbackUrl.startsWith("/") ? callbackUrl : "/";
      router.push(target);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark size="lg" showWordmark showTagline stacked href={null} />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">
            Create account
          </h1>
          <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
            Create your MABXCHANGE account
          </p>
        </div>
      </div>

      <DemoBanner compact />

      <form onSubmit={handleSubmit} className="mx-card space-y-4 p-5">
        {error && (
          <div className="rounded-xl mx-banner-danger px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[var(--mx-text)]">
            Display name
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mx-text-soft)]"
            />
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25"
              placeholder="Optional"
            />
          </div>
        </div>

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
              className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25"
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25"
              placeholder="At least 8 characters"
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--mx-text-muted)]">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="font-medium text-[var(--mx-primary)] hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-[var(--mx-text-soft)]">
        Demo environment · No real funds or live trading
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<BrandLoader fullScreen label="Loading MABXCHANGE…" />}>
      <SignUpForm />
    </Suspense>
  );
}
