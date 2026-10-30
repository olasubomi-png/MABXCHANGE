import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/security/session-user";
import {
  listDevices,
  revokeDevice,
  revokeAllDevices,
  touchDevice,
} from "@/lib/security/devices";
import { logSecurityEvent } from "@/lib/security/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authz = await requireAppUser();
  if (authz.error) {
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
      { error: err instanceof Error ? err.message : "Unavailable" },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authz = await requireAppUser();
  if (authz.error) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await revokeAllDevices(authz.appUser.id);
    await logSecurityEvent({
      userId: authz.appUser.id,
      eventType: "devices_revoked_all",
    });
    return NextResponse.json({ ok: true });
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
