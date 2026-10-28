import { NextRequest, NextResponse } from "next/server";
import {
  fetchMarketChart,
  hasCoingeckoKey,
  isChartRange,
  isSupportedCoinId,
} from "@/lib/coingecko";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * GET /api/market/chart?id=bitcoin&vs=usd&range=7d
 */
export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") || "").trim().toLowerCase();
  const vsParam = (req.nextUrl.searchParams.get("vs") || "usd").toLowerCase();
  const vs = vsParam === "ngn" ? "ngn" : "usd";
  const rangeParam = (req.nextUrl.searchParams.get("range") || "24h").toLowerCase();

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

  if (!isChartRange(rangeParam)) {
    return NextResponse.json(
      {
        error: "Invalid range",
        code: "INVALID_RANGE",
        message: "Supported ranges: 1h, 24h, 7d, 1m, 1y, all",
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
    const result = await fetchMarketChart(id, vs, rangeParam);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch chart data";
    const status = message.includes("rate limit") ? 429 : 502;
    return NextResponse.json(
      { error: "Chart data unavailable", code: "UPSTREAM_ERROR", message },
      { status }
    );
  }
}
