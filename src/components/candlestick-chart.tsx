"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  UTCTimestamp,
} from "lightweight-charts";
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

type CandlestickDataPoint = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
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
  const chartRef = useRef<IChartApi | null>(null);
  const [hover, setHover] = useState<OhlcCandle | null>(null);

  useEffect(() => {
    if (!containerRef.current || loading || error || candles.length < 2) {
      return;
    }

    let disposed = false;
    let chart: IChartApi | null = null;
    let onResize: (() => void) | null = null;
    let onCrosshair: ((param: MouseEventParams) => void) | null = null;

    const volumeByTime = new Map<number, number>();
    for (const c of candles) {
      volumeByTime.set(c.time, c.volume);
    }

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
      chartRef.current = chart;

      if (disposed) {
        chart.remove();
        chartRef.current = null;
        return;
      }

      let primarySeries:
        | ISeriesApi<"Candlestick">
        | ISeriesApi<"Area">
        | null = null;

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
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        primarySeries = series;
      } else {
        const series = chart.addAreaSeries({
          lineColor: "#2962FF",
          topColor: "rgba(41, 98, 255, 0.35)",
          bottomColor: "rgba(41, 98, 255, 0)",
          lineWidth: 2,
        });
        series.setData(
          candles.map((c) => ({
            time: c.time as UTCTimestamp,
            value: c.close,
          }))
        );
        primarySeries = series;
      }

      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volSeries.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
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
              time: p.time as UTCTimestamp,
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
              time: p.time as UTCTimestamp,
              value: p.value,
            }))
          );
        }
      }

      onCrosshair = (param: MouseEventParams) => {
        if (!param.time || !primarySeries) {
          setHover(null);
          return;
        }

        const t =
          typeof param.time === "number"
            ? param.time
            : typeof param.time === "object" &&
                param.time !== null &&
                "timestamp" in param.time
              ? Number(
                  (param.time as { timestamp?: number }).timestamp ?? 0
                )
              : 0;

        if (mode === "candle") {
          const raw = param.seriesData.get(primarySeries) as
            | CandlestickDataPoint
            | undefined;
          if (!raw || typeof raw.open !== "number") {
            setHover(null);
            return;
          }
          setHover({
            time: t,
            open: raw.open,
            high: raw.high,
            low: raw.low,
            close: raw.close,
            volume: volumeByTime.get(t) ?? 0,
          });
        } else {
          const raw = param.seriesData.get(primarySeries) as
            | { value?: number }
            | undefined;
          if (!raw || typeof raw.value !== "number") {
            setHover(null);
            return;
          }
          setHover({
            time: t,
            open: raw.value,
            high: raw.value,
            low: raw.value,
            close: raw.value,
            volume: volumeByTime.get(t) ?? 0,
          });
        }
      };

      chart.subscribeCrosshairMove(onCrosshair);
      chart.timeScale().fitContent();

      onResize = () => {
        if (containerRef.current && chart) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", onResize);
    })();

    return () => {
      disposed = true;
      if (onResize) {
        window.removeEventListener("resize", onResize);
      }
      if (chart && onCrosshair) {
        chart.unsubscribeCrosshairMove(onCrosshair);
      }
      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
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
      {hover && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--mx-text-muted)]">
          <span>{new Date(hover.time * 1000).toLocaleString()}</span>
          {mode === "candle" ? (
            <>
              <span>O {formatMoneyNative(hover.open, currency)}</span>
              <span>H {formatMoneyNative(hover.high, currency)}</span>
              <span>L {formatMoneyNative(hover.low, currency)}</span>
              <span>C {formatMoneyNative(hover.close, currency)}</span>
            </>
          ) : (
            <span>{formatMoneyNative(hover.close, currency)}</span>
          )}
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
