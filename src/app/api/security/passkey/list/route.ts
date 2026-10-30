import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import { listPasskeys, revokePasskey } from "@/lib/security/webauthn";
import { logSecurityEvent } from "@/lib/security/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const authz = await requireAppUser();
  if (authz.error) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  try {
    const passkeys = await listPasskeys(authz.appUser.id);
    return NextResponse.json({ passkeys });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list passkeys" },
      { status: 503 }
    );
  }
}

export async function DELETE(req: Request) {
  const authz = await requireAppUser();
  if (authz.error) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
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
