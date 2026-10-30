import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import {
  listDevices,
  revokeDevice,
  revokeAllDevices,
  touchDevice,
} from "@/lib/security/devices";
import { logSecurityEvent } from "@/lib/security/events";
import { consumeStepUpToken } from "@/lib/security/step-up";
import { publicSecurityError } from "@/lib/security/db-errors";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  try {
    await touchDevice({
      userId: authz.appUser.id,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for"),
    });
    const devices = await listDevices(authz.appUser.id);
    return NextResponse.json({ devices });
  } catch (err) {
    return NextResponse.json(
      { error: publicSecurityError(err, "Security service unavailable") },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authz = await requireAppUser();
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    const stepUpToken = String(body.stepUpToken || "");
    const stepped = await consumeStepUpToken({
      userId: authz.appUser.id,
      token: stepUpToken,
      purpose: "revoke_all_devices",
    });
    if (!stepped) {
      await logSecurityEvent({
        userId: authz.appUser.id,
        eventType: "devices_revoke_all_denied",
        metadata: { reason: "step_up_required" },
      });
      return NextResponse.json(
        {
          error: "Fresh verification required to revoke all devices",
          code: "STEP_UP_REQUIRED",
          purpose: "revoke_all_devices",
          neonSessionNote:
            "Device records are revoked in-app. Neon Auth session cookies are not globally invalidated by this action; sign out explicitly to end the browser session.",
        },
        { status: 403 }
      );
    }
    await revokeAllDevices(authz.appUser.id);
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "devices_revoked_all",
    });
    return NextResponse.json({
      ok: true,
      neonSessionNote:
        "Tracked devices revoked. Neon Managed Auth does not expose a documented global session-kill API here; call sign-out on each client to clear session cookies.",
    });
  }
  const id = String(body.id || "");
  const ok = await revokeDevice(authz.appUser.id, id);
  if (ok) {
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "device_revoked",
      metadata: { deviceId: id },
    });
  }
  return NextResponse.json({ ok });
}
