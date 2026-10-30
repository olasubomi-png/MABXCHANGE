import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import {
  beginTotpSetup,
  verifyAndEnableTotp,
  getTotpStatus,
  disableTotp,
  verifyTotpCode,
} from "@/lib/security/totp";
import { issueStepUpToken, consumeStepUpToken } from "@/lib/security/step-up";
import { logSecurityEvent } from "@/lib/security/events";
import { rateLimit } from "@/lib/security/rate-limit";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  try {
    const status = await getTotpStatus(authz.appUser.id);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const rl = rateLimit({
    key: `totp:${authz.appUser.id}`,
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  try {
    if (action === "setup") {
      const setup = await beginTotpSetup(
        authz.appUser.id,
        authz.session.user.email || "user"
      );
      const qrDataUrl = await QRCode.toDataURL(setup.otpauthUrl);
      return NextResponse.json({
        qrDataUrl,
        secret: setup.secret,
        note: "Scan with Google Authenticator, Microsoft Authenticator, Authy, or any RFC 6238 app. Codes are generated on your device.",
      });
    }

    if (action === "enable") {
      const result = await verifyAndEnableTotp(
        authz.appUser.id,
        String(body.code || "")
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      await logSecurityEvent({
        userId: authz.appUser.id,
        eventType: "totp_enabled",
        ip: req.headers.get("x-forwarded-for"),
      });
      return NextResponse.json({
        ok: true,
        recoveryCodes: result.recoveryCodes,
        warning:
          "Save these recovery codes now. They will not be shown again. Each code works once.",
      });
    }

    if (action === "verify") {
      const ok = await verifyTotpCode(authz.appUser.id, String(body.code || ""));
      if (!ok) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
      const stepUpToken = await issueStepUpToken({
        userId: authz.appUser.id,
        purpose: String(body.purpose || "security_settings"),
      });
      return NextResponse.json({ ok: true, stepUpToken });
    }

    if (action === "disable") {
      const token = String(body.stepUpToken || "");
      const allowed = await consumeStepUpToken({
        userId: authz.appUser.id,
        token,
        purpose: "disable_2fa",
      });
      if (!allowed) {
        return NextResponse.json(
          { error: "Fresh verification required to disable authenticator" },
          { status: 403 }
        );
      }
      await disableTotp(authz.appUser.id);
      await logSecurityEvent({
        userId: authz.appUser.id,
        eventType: "totp_disabled",
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOTP error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
