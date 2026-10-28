import { NextRequest, NextResponse } from "next/server";
import { fetchMarkets, hasCoingeckoKey } from "@/lib/coingecko";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const vsParam = (req.nextUrl.searchParams.get("vs") || "usd").toLowerCase();
  const vs = vsParam === "ngn" ? "ngn" : "usd";

  if (!hasCoingeckoKey()) {
    return NextResponse.json(
      {
        error: "Market data unavailable",
        code: "MISSING_API_KEY",
        message:
          "COINGECKO_API_KEY is not configured on the server. Add it in Vercel environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await fetchMarkets(vs);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch market data";
    const status = message.includes("rate limit") ? 429 : 502;
    return NextResponse.json(
      { error: "Market data unavailable", code: "UPSTREAM_ERROR", message },
      { status }
    );
  }
}
