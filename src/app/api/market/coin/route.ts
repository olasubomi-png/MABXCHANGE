import { NextRequest, NextResponse } from "next/server";
import {
  fetchCoinMarket,
  hasCoingeckoKey,
  isSupportedCoinId,
} from "@/lib/coingecko";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** GET /api/market/coin?id=bitcoin&vs=usd */
export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") || "").trim().toLowerCase();
  const vsParam = (req.nextUrl.searchParams.get("vs") || "usd").toLowerCase();
  const vs = vsParam === "ngn" ? "ngn" : "usd";

  if (!id || !isSupportedCoinId(id)) {
    return NextResponse.json(
      {
        error: "Invalid coin",
        code: "INVALID_COIN",
        message: "Coin id is not in the supported allowlist.",
      },
      { status: 400 }
    );
  }

  if (!hasCoingeckoKey()) {
    return NextResponse.json(
      {
        error: "Market data unavailable",
        code: "MISSING_API_KEY",
        message: "COINGECKO_API_KEY is not configured on the server.",
      },
      { status: 503 }
    );
  }

  try {
    const coin = await fetchCoinMarket(id, vs);
    return NextResponse.json(
      { coin, vsCurrency: vs, fetchedAt: new Date().toISOString(), delayed: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch coin";
    const status = message.includes("rate limit") ? 429 : 502;
    return NextResponse.json(
      { error: "Coin data unavailable", code: "UPSTREAM_ERROR", message },
      { status }
    );
  }
}
