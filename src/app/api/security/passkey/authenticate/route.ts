import { NextRequest, NextResponse } from "next/server";
import {
  beginPasskeyAuthentication,
  finishPasskeyAuthentication,
} from "@/lib/security/webauthn";
import { requireAppUser } from "@/lib/security/session-user";
import { issueStepUpToken } from "@/lib/security/step-up";
import { logSecurityEvent } from "@/lib/security/events";
import { rateLimit } from "@/lib/security/rate-limit";
import { publicSecurityError } from "@/lib/security/db-errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phase = body.phase === "finish" ? "finish" : "begin";
  const purpose = String(body.purpose || "security_settings");

  const rl = rateLimit({
    key: `passkey-auth:${req.headers.get("x-forwarded-for") || "ip"}`,
    limit: 30,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    if (phase === "begin") {
      const authz = await requireAppUser();
      const userId = authz.ok ? authz.appUser.id : undefined;
      const options = await beginPasskeyAuthentication(userId);
      return NextResponse.json({ options });
    }

    const authz = await requireAppUser();
    if (!authz.ok) {
      return NextResponse.json(
        {
          error:
            "Passkey is used for step-up verification while signed in. Sign in with Neon Auth first.",
          code: "SESSION_REQUIRED",
        },
        { status: 401 }
      );
    }

    const result = await finishPasskeyAuthentication({
      response: body.response,
      expectedUserId: authz.appUser.id,
    });

    const stepUpToken = await issueStepUpToken({
      userId: result.userId,
      purpose,
      ttlSeconds: 300,
    });

    await logSecurityEvent({
      userId: result.userId,
      eventType: "passkey_step_up",
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
      metadata: { purpose },
    });

    return NextResponse.json({
      ok: true,
      stepUpToken,
      purpose,
      note: "Passkey verified for step-up. Primary session remains Neon Auth.",
    });
  } catch (err) {
    return NextResponse.json({ error: publicSecurityError(err, "Passkey verification failed") }, { status: 400 });
  }
}
