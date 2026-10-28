"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Currency } from "@/lib/currency";
import { formatMoneyNative } from "@/lib/currency";
import type { ChartRange } from "@/lib/coingecko";

export type ChartPoint = { t: number; price: number };

type Props = {
  points: ChartPoint[];
  currency: Currency;
  range: ChartRange;
  loading?: boolean;
  error?: string | null;
  note?: string | null;
  color?: string;
};

function formatAxisTime(ts: number, range: ChartRange): string {
  const d = new Date(ts);
  if (range === "1h" || range === "24h") {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (range === "7d" || range === "1m") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function PriceChart({
  points,
  currency,
  range,
  loading,
  error,
  note,
  color = "#2962FF",
}: Props) {
  const data = useMemo(
    () => points.map((p) => ({ ...p, label: formatAxisTime(p.t, range) })),
    [points, range]
  );

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-sm text-[var(--mx-text-muted)]">
        Loading chart…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-[var(--mx-border)] bg-[var(--mx-surface-2)] px-4 text-center text-sm text-[var(--mx-text-muted)]">
        <p>Chart unavailable</p>
        <p className="text-xs text-[var(--mx-text-soft)]">{error}</p>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-[var(--mx-surface-2)] text-sm text-[var(--mx-text-muted)]">
        Not enough history for this range
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mxPriceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#263247" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8997AC", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#8997AC", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(v >= 1 ? 0 : 4)
              }
            />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #263247",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#B7C2D3" }}
              formatter={(value: number | string) => [
                formatMoneyNative(Number(value), currency),
                "Price",
              ]}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartPoint | undefined;
                if (!row?.t) return "";
                return new Date(row.t).toLocaleString();
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill="url(#mxPriceFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {note && (
        <p className="mt-2 text-center text-[11px] text-[var(--mx-text-soft)]">
          {note}
        </p>
      )}
    </div>
  );
}
