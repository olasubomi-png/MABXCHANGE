"use client";

import { useEffect, useRef, useState } from "react";
import type { CandleInterval, OhlcCandle } from "@/lib/ohlc";
import { computeEMA, computeSMA } from "@/lib/ohlc";
import { formatMoneyNative, type Currency } from "@/lib/currency";

type Props = {
  candles: OhlcCandle[];
  currency: Currency;
  interval: CandleInterval;
  loading?: boolean;
  error?: string | null;
  note?: string | null;
  showMa?: boolean;
  showEma?: boolean;
  mode?: "candle" | "line";
};

export function CandlestickChart({
  candles,
  currency,
  interval,
  loading,
  error,
  note,
  showMa = true,
  showEma = false,
  mode = "candle",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<OhlcCandle | null>(null);

  useEffect(() => {
    if (!containerRef.current || loading || error || candles.length < 2) return;

    let disposed = false;
    let chart: import("lightweight-charts").IChartApi | null = null;

    (async () => {
      const lc = await import("lightweight-charts");
      if (disposed || !containerRef.current) return;

      chart = lc.createChart(containerRef.current, {
        layout: {
          background: { color: "#111827" },
          textColor: "#B7C2D3",
        },
        grid: {
          vertLines: { color: "#263247" },
          horzLines: { color: "#263247" },
        },
        crosshair: {
          mode: lc.CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: "#263247",
        },
        timeScale: {
          borderColor: "#263247",
          timeVisible: true,
          secondsVisible: interval === "1m" || interval === "5m",
        },
        width: containerRef.current.clientWidth,
        height: 320,
      });

      if (mode === "candle") {
        const series = chart.addCandlestickSeries({
          upColor: "#00C853",
          downColor: "#FF4D5E",
          borderUpColor: "#00C853",
          borderDownColor: "#FF4D5E",
          wickUpColor: "#00C853",
          wickDownColor: "#FF4D5E",
        });
        series.setData(
          candles.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );

        series.subscribeCrosshairMove((param) => {
          if (!param.time || !param.seriesData) {
            setHover(null);
            return;
          }
          const raw = param.seriesData.get(series) as
            | { open: number; high: number; low: number; close: number }
            | undefined;
          if (!raw) {
            setHover(null);
            return;
          }
          const t = typeof param.time === "number" ? param.time : 0;
          const vol =
            candles.find((c) => c.time === t)?.volume ?? 0;
          setHover({
            time: t,
            open: raw.open,
            high: raw.high,
            low: raw.low,
            close: raw.close,
            volume: vol,
          });
        });
      } else {
        const series = chart.addAreaSeries({
          lineColor: "#2962FF",
          topColor: "rgba(41, 98, 255, 0.35)",
          bottomColor: "rgba(41, 98, 255, 0)",
          lineWidth: 2,
        });
        series.setData(
          candles.map((c) => ({
            time: c.time as import("lightweight-charts").UTCTimestamp,
            value: c.close,
          }))
        );
      }

      // Volume
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volSeries.setData(
        candles.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          value: c.volume,
          color:
            c.close >= c.open
              ? "rgba(0, 200, 83, 0.35)"
              : "rgba(255, 77, 94, 0.35)",
        }))
      );

      if (showMa && mode === "candle") {
        const ma = computeSMA(candles, 20);
        if (ma.length) {
          const maSeries = chart.addLineSeries({
            color: "#FFB020",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          maSeries.setData(
            ma.map((p) => ({
              time: p.time as import("lightweight-charts").UTCTimestamp,
              value: p.value,
            }))
          );
        }
      }

      if (showEma && mode === "candle") {
        const ema = computeEMA(candles, 20);
        if (ema.length) {
          const emaSeries = chart.addLineSeries({
            color: "#a78bfa",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          emaSeries.setData(
            ema.map((p) => ({
              time: p.time as import("lightweight-charts").UTCTimestamp,
              value: p.value,
            }))
          );
        }
      }

      chart.timeScale().fitContent();

      const onResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    })();

    return () => {
      disposed = true;
      if (chart) {
        chart.remove();
        chart = null;
      }
    };
  }, [candles, currency, interval, loading, error, showMa, showEma, mode]);

  if (loading) {
    return (
      <div className="flex h-[320px] animate-pulse items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-sm text-[var(--mx-text-muted)]">
        Loading chart…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 text-center text-sm text-[var(--mx-text-muted)]">
        <p>Chart unavailable</p>
        <p className="text-xs text-[var(--mx-text-soft)]">{error}</p>
      </div>
    );
  }

  if (candles.length < 2) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-sm text-[var(--mx-text-muted)]">
        Not enough OHLC history for this interval
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {hover && mode === "candle" && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--mx-text-muted)]">
          <span>{new Date(hover.time * 1000).toLocaleString()}</span>
          <span>O {formatMoneyNative(hover.open, currency)}</span>
          <span>H {formatMoneyNative(hover.high, currency)}</span>
          <span>L {formatMoneyNative(hover.low, currency)}</span>
          <span>C {formatMoneyNative(hover.close, currency)}</span>
        </div>
      )}
      <div ref={containerRef} className="w-full overflow-hidden rounded-xl" />
      {note && (
        <p className="text-center text-[11px] text-[var(--mx-text-soft)]">
          {note}
        </p>
      )}
    </div>
  );
}
