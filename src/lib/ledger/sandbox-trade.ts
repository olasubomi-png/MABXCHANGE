/**
 * Sandbox-only simulated buy / sell / swap.
 * Requires existing customer_accounts balance rows — never invents deposits.
 * Real-money settlement remains disabled.
 */

import { postLedgerTransaction, findAvailableAccount } from "./service";
import { isValueConserved } from "./conservation";
import type { PostingResult, SandboxTradeKind } from "./types";

export { isValueConserved } from "./conservation";

export const SANDBOX_FEE_BPS = 10; // 0.10% transparent DEMO fee

export type SandboxTradeInput = {
  appUserId: string;
  kind: "buy" | "sell" | "swap";
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  /** toSymbol received per 1 fromSymbol (sell/swap). For buy: quote spent per 1 base → rate is quote/base */
  rate: number;
  idempotencyKey: string;
};

function feeOn(amount: number): number {
  return (amount * SANDBOX_FEE_BPS) / 10_000;
}


export async function executeSandboxTrade(
  input: SandboxTradeInput
): Promise<PostingResult & { fee?: number; toAmount?: number }> {
  if (!input.appUserId) {
    return { ok: false, code: "UNAUTHORIZED", message: "Not authenticated" };
  }
  if (!Number.isFinite(input.fromAmount) || input.fromAmount <= 0) {
    return { ok: false, code: "INVALID", message: "Invalid amount" };
  }
  if (!Number.isFinite(input.rate) || input.rate <= 0) {
    return { ok: false, code: "INVALID", message: "Invalid rate" };
  }
  if (input.fromSymbol.toUpperCase() === input.toSymbol.toUpperCase()) {
    return { ok: false, code: "INVALID", message: "from and to assets must differ" };
  }

  const fromAcct = await findAvailableAccount({
    userId: input.appUserId,
    assetSymbol: input.fromSymbol,
  });
  const toAcct = await findAvailableAccount({
    userId: input.appUserId,
    assetSymbol: input.toSymbol,
  });

  if (!fromAcct || !toAcct) {
    return {
      ok: false,
      code: "INSUFFICIENT_FUNDS",
      message:
        "No funded available balance for this pair. DEMO trades require existing balance rows — real deposits are disabled.",
    };
  }

  const fee = feeOn(input.fromAmount);
  const totalFrom = input.fromAmount + fee;
  if (fromAcct.balance + 1e-9 < totalFrom) {
    return {
      ok: false,
      code: "INSUFFICIENT_FUNDS",
      message: `Insufficient ${input.fromSymbol} (need ${totalFrom} incl. ${SANDBOX_FEE_BPS} bps DEMO fee)`,
    };
  }

  const toAmount =
    input.kind === "buy"
      ? input.fromAmount / input.rate
      : input.fromAmount * input.rate;

  if (!Number.isFinite(toAmount) || toAmount <= 0) {
    return { ok: false, code: "INVALID", message: "Invalid output amount" };
  }

  if (
    !isValueConserved({
      fromAmount: input.fromAmount,
      toAmount,
      rate: input.rate,
      kind: input.kind,
    })
  ) {
    return { ok: false, code: "INVALID", message: "Rate/amount mismatch" };
  }

  const kindMap: Record<string, SandboxTradeKind> = {
    buy: "sandbox_buy",
    sell: "sandbox_sell",
    swap: "sandbox_swap",
  };

  /**
   * Multi-asset trade postings are not single-asset balanced.
   * We use trade-mode posting: ownership + non-negative + value conservation,
   * with full audit trail. Fee is burned from the outflow (DEMO).
   */
  const result = await postLedgerTransaction({
    userId: input.appUserId,
    idempotencyKey: input.idempotencyKey,
    kind: kindMap[input.kind],
    balanceMode: "trade",
    entries: [
      {
        accountId: fromAcct.accountId,
        assetId: fromAcct.assetId,
        side: "debit",
        amount: totalFrom,
      },
      {
        accountId: toAcct.accountId,
        assetId: toAcct.assetId,
        side: "credit",
        amount: toAmount,
      },
    ],
    metadata: {
      demo: true,
      sandbox: true,
      label: "DEMO",
      fromSymbol: input.fromSymbol,
      toSymbol: input.toSymbol,
      fromAmount: input.fromAmount,
      toAmount,
      fee,
      feeBps: SANDBOX_FEE_BPS,
      rate: input.rate,
      kind: input.kind,
      note: "Sandbox simulated trade — not real settlement",
    },
  });

  if (result.ok) return { ...result, fee, toAmount };
  return result;
}
