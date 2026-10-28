"use client";

export type Currency = "NGN" | "USD";

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/20 bg-black/20 p-0.5">
      {(["NGN", "USD"] as Currency[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            value === c
              ? "bg-white text-[#0B0F19] shadow-sm"
              : "text-blue-100 hover:text-white"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
