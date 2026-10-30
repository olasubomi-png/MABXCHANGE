"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import {
  ArrowLeft,
  Fingerprint,
  KeyRound,
  Loader2,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";

type Passkey = {
  id: string;
  name: string;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

type Device = {
  id: string;
  label: string;
  userAgent: string | null;
  approxLocation: string | null;
  trusted: boolean;
  lastSeenAt: string;
  revoked: boolean;
};

export default function SecurityPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [recoveryLeft, setRecoveryLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, t, d] = await Promise.all([
        fetch("/api/security/passkey/list").then((r) => r.json()),
        fetch("/api/security/totp").then((r) => r.json()),
        fetch("/api/security/devices").then((r) => r.json()),
      ]);
      if (p.passkeys) setPasskeys(p.passkeys);
      if (t.enabled != null) setTotpEnabled(Boolean(t.enabled));
      if (t.unusedRecoveryCodes != null)
        setRecoveryLeft(Number(t.unusedRecoveryCodes));
      if (d.devices) setDevices(d.devices);
      if (p.error || t.error || d.error) {
        setError(p.error || t.error || d.error);
      }
    } catch {
      setError("Could not load security settings. Apply migrations if needed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function registerPasskey() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const begin = await fetch("/api/security/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "begin" }),
      }).then((r) => r.json());
      if (begin.error) throw new Error(begin.error);
      const att = await startRegistration({ optionsJSON: begin.options });
      const finish = await fetch("/api/security/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          response: att,
          name: "My passkey",
        }),
      }).then((r) => r.json());
      if (finish.error) throw new Error(finish.error);
      setInfo("Passkey registered. Biometrics stay on your device.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Passkey registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPasskeyStepUp() {
    setBusy(true);
    setError(null);
    try {
      const begin = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "begin", purpose: "security_settings" }),
      }).then((r) => r.json());
      if (begin.error) throw new Error(begin.error);
      const assertion = await startAuthentication({
        optionsJSON: begin.options,
      });
      const finish = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          response: assertion,
          purpose: "security_settings",
        }),
      }).then((r) => r.json());
      if (finish.error) throw new Error(finish.error);
      setInfo("Passkey step-up verified.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Passkey verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function setupTotp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setQr(res.qrDataUrl);
      setManualSecret(res.secret);
      setInfo(res.note || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "TOTP setup failed");
    } finally {
      setBusy(false);
    }
  }

  async function enableTotp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/security/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: totpCode }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setRecoveryCodes(res.recoveryCodes || []);
      setQr(null);
      setManualSecret(null);
      setTotpCode("");
      setInfo(res.warning || "Authenticator enabled.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable TOTP");
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: string) {
    setBusy(true);
    setError(null);
    try {
      // Fresh passkey verification bound to remove_passkey purpose
      const begin = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "begin", purpose: "remove_passkey" }),
      }).then((r) => r.json());
      if (begin.error) throw new Error(begin.error);
      const assertion = await startAuthentication({
        optionsJSON: begin.options,
      });
      const finish = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          response: assertion,
          purpose: "remove_passkey",
        }),
      }).then((r) => r.json());
      if (finish.error) throw new Error(finish.error);
      const res = await fetch("/api/security/passkey/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stepUpToken: finish.stepUpToken }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setInfo("Passkey removed after step-up verification.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove passkey");
    } finally {
      setBusy(false);
    }
  }

  async function revokeAll() {
    setBusy(true);
    setError(null);
    try {
      const begin = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "begin", purpose: "revoke_all_devices" }),
      }).then((r) => r.json());
      if (begin.error) throw new Error(begin.error);
      const assertion = await startAuthentication({
        optionsJSON: begin.options,
      });
      const finish = await fetch("/api/security/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "finish",
          response: assertion,
          purpose: "revoke_all_devices",
        }),
      }).then((r) => r.json());
      if (finish.error) throw new Error(finish.error);
      const res = await fetch("/api/security/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, stepUpToken: finish.stepUpToken }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setInfo(
        res.neonSessionNote ||
          "Tracked devices revoked. Sign out on other browsers to clear Neon sessions."
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke devices");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="rounded-lg border border-[var(--mx-border)] p-2 text-[var(--mx-text-muted)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--mx-text)]">
            Account Security
          </h1>
          <p className="text-sm text-[var(--mx-text-muted)]">
            Passkeys, authenticator app, and devices
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--mx-danger)]/40 bg-[var(--mx-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--mx-danger)]">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl border border-[var(--mx-primary)]/30 bg-[var(--mx-primary-soft)] px-3.5 py-2.5 text-sm text-[var(--mx-text)]">
          {info}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--mx-text-muted)]">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Passkeys */}
          <section className="mx-card space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Fingerprint className="text-[var(--mx-primary)]" size={18} />
              <h2 className="font-semibold text-[var(--mx-text)]">Passkeys</h2>
            </div>
            <p className="text-xs text-[var(--mx-text-muted)]">
              Use Face ID, fingerprint, or device PIN. Biometric data never leaves
              your device and is never stored by MABXCHANGE.
            </p>
            <ul className="divide-y divide-[var(--mx-border)]">
              {passkeys.map((pk) => (
                <li
                  key={pk.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-[var(--mx-text)]">{pk.name}</p>
                    <p className="text-[11px] text-[var(--mx-text-soft)]">
                      {pk.deviceType || "Passkey"} · added{" "}
                      {new Date(pk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removePasskey(pk.id)}
                    className="rounded-lg p-2 text-[var(--mx-danger)]"
                    aria-label="Remove passkey"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {passkeys.length === 0 && (
                <li className="py-2 text-sm text-[var(--mx-text-muted)]">
                  No passkeys registered
                </li>
              )}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={registerPasskey}
                className="mx-btn mx-btn-primary px-3 py-2 text-sm"
              >
                Register passkey
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={verifyPasskeyStepUp}
                className="mx-btn mx-btn-secondary px-3 py-2 text-sm"
              >
                Verify passkey
              </button>
            </div>
          </section>

          {/* TOTP */}
          <section className="mx-card space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Smartphone className="text-[var(--mx-primary)]" size={18} />
              <h2 className="font-semibold text-[var(--mx-text)]">
                Authenticator app
              </h2>
            </div>
            <p className="text-xs text-[var(--mx-text-muted)]">
              Status:{" "}
              <span className="font-semibold text-[var(--mx-text)]">
                {totpEnabled ? "Enabled" : "Not enabled"}
              </span>
              {totpEnabled
                ? ` · ${recoveryLeft} recovery codes remaining`
                : ""}
            </p>
            {!totpEnabled && !qr && (
              <button
                type="button"
                disabled={busy}
                onClick={setupTotp}
                className="mx-btn mx-btn-primary px-3 py-2 text-sm"
              >
                Enable authenticator app
              </button>
            )}
            {qr && (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="TOTP QR code"
                  className="mx-auto rounded-lg bg-white p-2"
                  width={180}
                  height={180}
                />
                {manualSecret && (
                  <p className="break-all text-center text-xs text-[var(--mx-text-muted)]">
                    Manual key: <code>{manualSecret}</code>
                  </p>
                )}
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-3 py-2.5 text-sm text-[var(--mx-text)]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={enableTotp}
                  className="mx-btn mx-btn-primary w-full py-2.5 text-sm"
                >
                  Confirm and enable
                </button>
              </div>
            )}
            {recoveryCodes && (
              <div className="rounded-xl border border-[var(--mx-warning)]/40 bg-[var(--mx-warning-soft)] p-3">
                <p className="mb-2 text-xs font-semibold text-[var(--mx-warning)]">
                  Save these recovery codes now
                </p>
                <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-[var(--mx-text)]">
                  {recoveryCodes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Devices */}
          <section className="mx-card space-y-3 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Shield className="text-[var(--mx-primary)]" size={18} />
              <h2 className="font-semibold text-[var(--mx-text)]">
                Devices & activity
              </h2>
            </div>
            <ul className="divide-y divide-[var(--mx-border)]">
              {devices.map((d) => (
                <li key={d.id} className="py-2.5 text-sm">
                  <p className="font-medium text-[var(--mx-text)]">
                    {d.label}
                    {d.revoked ? " (revoked)" : ""}
                  </p>
                  <p className="text-[11px] text-[var(--mx-text-soft)]">
                    Last active {new Date(d.lastSeenAt).toLocaleString()}
                    {d.approxLocation ? ` · ${d.approxLocation}` : ""}
                  </p>
                </li>
              ))}
              {devices.length === 0 && (
                <li className="py-2 text-sm text-[var(--mx-text-muted)]">
                  No devices tracked yet
                </li>
              )}
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={revokeAll}
              className="mx-btn mx-btn-secondary px-3 py-2 text-sm"
            >
              Revoke all tracked devices
            </button>
          </section>

          <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
            <KeyRound className="mr-1 inline" size={12} />
            Primary sign-in uses Neon Auth. Passkeys and TOTP provide step-up
            protection for sensitive actions. Financial withdrawals remain
            disabled.
          </p>
        </>
      )}
    </div>
  );
}
