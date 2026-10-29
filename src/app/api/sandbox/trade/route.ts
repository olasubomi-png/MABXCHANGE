import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { provisionAuthenticatedUser } from "@/lib/db";
import { executeSandboxTrade } from "@/lib/ledger/sandbox-trade";
import { isValidIdempotencyKey } from "@/lib/ledger-safety";

export const dynamic = "force-dynamic";

/**
 * POST /api/sandbox/trade
 * Sandbox-only simulated buy/sell. Requires session + existing balances.
 * Never processes real money.
 */
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
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID" },
      { status: 400 }
    );
  }

  const kind = body.kind === "sell" ? "sell" : body.kind === "buy" ? "buy" : null;
  const fromSymbol = String(body.fromSymbol || "").toUpperCase();
  const toSymbol = String(body.toSymbol || "").toUpperCase();
  const fromAmount = Number(body.fromAmount);
  const rate = Number(body.rate);
  const idempotencyKey = String(body.idempotencyKey || "");

  if (!kind || !fromSymbol || !toSymbol) {
    return NextResponse.json(
      { error: "kind, fromSymbol, toSymbol required", code: "INVALID" },
      { status: 400 }
    );
  }
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json(
      { error: "idempotencyKey must be 8–128 characters", code: "INVALID" },
      { status: 400 }
    );
  }

  const { appUser, dbError } = await provisionAuthenticatedUser({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  if (dbError || !appUser.id) {
    return NextResponse.json(
      {
        error: dbError || "Account provisioning failed",
        code: "DB_ERROR",
      },
      { status: 503 }
    );
  }

  const result = await executeSandboxTrade({
    appUserId: appUser.id,
    kind,
    fromSymbol,
    toSymbol,
    fromAmount,
    rate,
    idempotencyKey,
  });

  if (!result.ok) {
    const status =
      result.code === "UNAUTHORIZED"
        ? 401
        : result.code === "INSUFFICIENT_FUNDS"
          ? 402
          : result.code === "NOT_FOUND"
            ? 404
            : result.code === "CONFLICT"
              ? 409
              : 400;
    return NextResponse.json(
      {
        error: result.message,
        code: result.code,
        demo: true,
        sandbox: true,
      },
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
    message: result.duplicate
      ? "Duplicate idempotency key — returning original sandbox trade"
      : "Sandbox trade posted (DEMO — not real settlement)",
  });
}
