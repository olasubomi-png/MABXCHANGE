import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import { listPasskeys, revokePasskey } from "@/lib/security/webauthn";
import { logSecurityEvent } from "@/lib/security/events";
import { consumeStepUpToken } from "@/lib/security/step-up";
import { publicSecurityError } from "@/lib/security/db-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  try {
    const passkeys = await listPasskeys(authz.appUser.id);
    return NextResponse.json({ passkeys });
  } catch (err) {
    return NextResponse.json(
      { error: publicSecurityError(err, "Failed to load passkeys") },
      { status: 503 }
    );
  }
}

export async function DELETE(req: Request) {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const stepUpToken = String(body.stepUpToken || "");
  const stepped = await consumeStepUpToken({
    userId: authz.appUser.id,
    token: stepUpToken,
    purpose: "remove_passkey",
  });
  if (!stepped) {
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "passkey_revoke_denied",
      metadata: { reason: "step_up_required" },
    });
    return NextResponse.json(
      {
        error: "Fresh verification required to remove a passkey",
        code: "STEP_UP_REQUIRED",
        purpose: "remove_passkey",
      },
      { status: 403 }
    );
  }

  const ok = await revokePasskey(authz.appUser.id, id);
  if (ok) {
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "passkey_revoked",
      metadata: { passkeyId: id },
    });
  }
  return NextResponse.json({ ok });
}
