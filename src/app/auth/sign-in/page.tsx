"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Fingerprint, Loader2, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { DemoBanner } from "@/components/demo-banner";
import { BrandMark } from "@/components/brand-mark";
import { BrandLoader } from "@/components/brand-loader";

/** Official multicolour Google "G" mark */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  /** Safe internal path only — never allow open redirects */
  function safeCallbackPath(raw: string): string {
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/";
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    try {
      const path = safeCallbackPath(callbackUrl);
      // Absolute URL on this origin so Neon can redirect back to a trusted domain
      const callbackURL =
        typeof window !== "undefined"
          ? `${window.location.origin}${path}`
          : path;

      const { error: socialError } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (socialError) {
        setError(
          socialError.message ||
            "Google sign-in could not start. Please try again or use email."
        );
        setGoogleLoading(false);
      }
      // On success the browser navigates away to Google / Neon callback
    } catch {
      setError("Google sign-in could not start. Please try again or use email.");
      setGoogleLoading(false);
    }
  }

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
        setError(
          signInError.message || "Unable to sign in. Check your credentials."
        );
        setLoading(false);
        return;
      }

      const target = safeCallbackPath(callbackUrl);
      router.push(target);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark size="lg" showWordmark showTagline stacked href={null} />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--mx-text)]">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-[var(--mx-text-muted)]">
            Sign in to your MABXCHANGE account
          </p>
        </div>
      </div>

      <DemoBanner compact />

      {/* Google OAuth */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface)] py-2.5 text-sm font-medium text-[var(--mx-text)] shadow-sm transition hover:bg-[var(--mx-surface-2)] hover:border-[var(--mx-border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-[var(--mx-text-muted)]" />
          ) : (
            <GoogleLogo />
          )}
          {googleLoading ? "Connecting to Google…" : "Continue with Google"}
        </button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--mx-border)]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mx-text-soft)]">
            Or continue with email
          </span>
          <div className="h-px flex-1 bg-[var(--mx-border)]" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-card space-y-4 p-5">
        {error && (
          <div className="rounded-xl mx-banner-danger px-3.5 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--mx-text)]"
          >
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
              disabled={busy}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25 disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--mx-text)]"
          >
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
              disabled={busy}
              className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] py-2.5 pl-10 pr-3 text-sm text-[var(--mx-text)] outline-none transition placeholder:text-[var(--mx-text-soft)] focus:border-[var(--mx-primary)] focus:ring-2 focus:ring-[var(--mx-primary)]/25 disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
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
        Passkeys & authenticator: enable after sign-in under Profile → Account Security. Primary login uses Neon Auth (email/password or Google).
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<BrandLoader fullScreen label="Loading MABXCHANGE…" />}>
      <SignInForm />
    </Suspense>
  );
}
