export type LedgerSide = "debit" | "credit";

export type SandboxTradeKind = "sandbox_buy" | "sandbox_sell" | "sandbox_swap";

export type BalanceBucket = "available" | "locked";

export type LedgerEntryDraft = {
  accountId: string;
  assetId: string;
  side: LedgerSide;
  /** Positive decimal amount in asset units */
  amount: number;
};

export type PostingRequest = {
  userId: string;
  idempotencyKey: string;
  kind: SandboxTradeKind | string;
  entries: LedgerEntryDraft[];
  /**
   * strict: every asset must have matching debit/credit totals (transfers).
   * trade: multi-asset sandbox trade; non-negative balances + ownership only.
   */
  balanceMode?: "strict" | "trade";
  /** Opaque metadata for audit (no secrets) */
  metadata?: Record<string, unknown>;
};

export type PostingResult =
  | {
      ok: true;
      transactionId: string;
      duplicate: boolean;
    }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "INVALID"
        | "INSUFFICIENT_FUNDS"
        | "NOT_FOUND"
        | "CONFLICT"
        | "DISABLED"
        | "DB_ERROR";
      message: string;
    };
