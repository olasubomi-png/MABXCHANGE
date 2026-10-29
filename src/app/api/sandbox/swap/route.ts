import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { provisionAuthenticatedUser } from "@/lib/db";
import { executeSandboxTrade } from "@/lib/ledger/sandbox-trade";
import { isValidIdempotencyKey } from "@/lib/ledger-safety";

export const dynamic = "force-dynamic";

/** POST /api/sandbox/swap — DEMO only */
export async function POST(req: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "INVALID" }, { status: 400 });
  }

  const fromSymbol = String(body.fromSymbol || "").toUpperCase();
  const toSymbol = String(body.toSymbol || "").toUpperCase();
  const fromAmount = Number(body.fromAmount);
  const rate = Number(body.rate);
  const idempotencyKey = String(body.idempotencyKey || "");

  if (!fromSymbol || !toSymbol || !isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json({ error: "Invalid parameters", code: "INVALID" }, { status: 400 });
  }

  const { appUser, dbError } = await provisionAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
  if (dbError || !appUser.id) {
    return NextResponse.json(
      { error: dbError || "Account unavailable", code: "DB_ERROR" },
      { status: 503 }
    );
  }

  const result = await executeSandboxTrade({
    appUserId: appUser.id,
    kind: "swap",
    fromSymbol,
    toSymbol,
    fromAmount,
    rate,
    idempotencyKey,
  });

  if (!result.ok) {
    const status = result.code === "INSUFFICIENT_FUNDS" ? 402 : 400;
    return NextResponse.json(
      { error: result.message, code: result.code, demo: true, sandbox: true },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
    duplicate: result.duplicate,
    fee: result.fee,
    toAmount: result.toAmount,
    demo: true,
    sandbox: true,
    label: "DEMO",
  });
}
