import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import {
  beginPasskeyRegistration,
  finishPasskeyRegistration,
} from "@/lib/security/webauthn";
import { logSecurityEvent } from "@/lib/security/events";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authz = await requireAppUser();
  if (authz.error) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  const rl = rateLimit({
    key: `passkey-reg:${authz.appUser.id}`,
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const phase = body.phase === "finish" ? "finish" : "begin";

  try {
    if (phase === "begin") {
      const options = await beginPasskeyRegistration(
        authz.appUser.id,
        authz.session.user.email || authz.appUser.id
      );
      return NextResponse.json({ options });
    }

    await finishPasskeyRegistration({
      userId: authz.appUser.id,
      response: body.response,
      name: body.name,
    });
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "passkey_registered",
      ip: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Passkey error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
