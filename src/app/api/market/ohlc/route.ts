import { NextRequest, NextResponse } from "next/server";
import { isSupportedCoinId } from "@/lib/coingecko";
import {
  fetchOhlc,
  isCandleInterval,
  scaleCandles,
  type CandleInterval,
} from "@/lib/ohlc";

export const dynamic = "force-dynamic";
export const revalidate = 30;

/**
 * GET /api/market/ohlc?id=bitcoin&interval=1h&vs=usd|ngn
 * Providers: Kraken (primary) → CoinGecko Demo OHLC (fallback).
 * Binance is not used.
 */
export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") || "").trim().toLowerCase();
  const intervalParam = (
    req.nextUrl.searchParams.get("interval") || "1h"
  ).toLowerCase();
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

  if (!isCandleInterval(intervalParam)) {
    return NextResponse.json(
      {
        error: "Invalid interval",
        code: "INVALID_INTERVAL",
        message: "Supported: 1m, 5m, 15m, 1h, 4h, 1d, 1w",
      },
      { status: 400 }
    );
  }

  try {
    const result = await fetchOhlc(
      id,
      intervalParam as CandleInterval,
      vs
    );

    // Kraken returns USD; scale to NGN via CoinGecko USDT/NGN when requested
    if (vs === "ngn" && result.source === "kraken") {
      let rate: number | null = null;
      const key = process.env.COINGECKO_API_KEY?.trim();
      if (key) {
        try {
          const r = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn",
            {
              headers: {
                Accept: "application/json",
                "x-cg-demo-api-key": key,
              },
              next: { revalidate: 120 },
            }
          );
          if (r.ok) {
            const body = (await r.json()) as { tether?: { ngn?: number } };
            if (typeof body?.tether?.ngn === "number" && body.tether.ngn > 0) {
              rate = body.tether.ngn;
            }
          }
        } catch {
          rate = null;
        }
      }

      if (rate) {
        return NextResponse.json(
          {
            ...result,
            vsCurrency: "ngn",
            candles: scaleCandles(result.candles, rate),
            fxRate: rate,
            fxNote: "NGN scaled by CoinGecko USDT/NGN rate",
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            },
          }
        );
      }

      return NextResponse.json(
        {
          ...result,
          vsCurrency: "usd",
          fxUnavailable: true,
          note:
            (result.note ?? "") +
            " NGN conversion unavailable — showing USD candles.",
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    return NextResponse.json(
      {
        ...result,
        vsCurrency: vs,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch OHLC";
    const status = message.includes("rate limit")
      ? 429
      : message.includes("not available") || message.includes("stablecoin")
        ? 404
        : 502;
    return NextResponse.json(
      {
        error: "OHLC unavailable",
        code: "UPSTREAM_ERROR",
        message,
      },
      { status }
    );
  }
}
