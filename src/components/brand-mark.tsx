import Link from "next/link";

type BrandMarkProps = {
  /** Visual size of the icon */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show wordmark next to the icon */
  showWordmark?: boolean;
  /** Show TRADE • INVEST • GROW under the wordmark */
  showTagline?: boolean;
  /** Wrap in a home link */
  href?: string | null;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Center-aligned stacked layout (auth screens) */
  stacked?: boolean;
};

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
} as const;

/**
 * Custom MABXCHANGE mark: angular electric-blue M with an integrated
 * green upward-growth arrow. SVG for crisp rendering at every size.
 */
export function MabLogoIcon({
  size = 36,
  className = "",
  glowing = false,
}: {
  size?: number;
  className?: string;
  glowing?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={
        glowing
          ? { filter: "drop-shadow(0 0 10px rgba(41, 98, 255, 0.55))" }
          : undefined
      }
    >
      {/* Soft plate behind the mark */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="#151E2E"
        stroke="#263247"
        strokeWidth="1.5"
      />
      {/* Angular M — electric blue */}
      <path
        d="M14 46 V18 L26 38 L32 26 L38 38 L50 18 V46"
        stroke="#2962FF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Green growth arrow rising through the center valley */}
      <path
        d="M32 42 V22"
        stroke="#00C853"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M24.5 30 L32 20 L39.5 30"
        stroke="#00C853"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function BrandMark({
  size = "md",
  showWordmark = true,
  showTagline = false,
  href = "/",
  className = "",
  stacked = false,
}: BrandMarkProps) {
  const px = sizeMap[size];

  const content = (
    <span
      className={
        stacked
          ? `inline-flex flex-col items-center gap-2.5 ${className}`
          : `inline-flex items-center gap-2.5 ${className}`
      }
    >
      <MabLogoIcon size={px} />
      {showWordmark && (
        <span
          className={
            stacked ? "flex flex-col items-center gap-0.5" : "flex flex-col"
          }
        >
          <span
            className={`font-bold tracking-tight text-[var(--mx-text)] ${
              size === "sm"
                ? "text-sm"
                : size === "md"
                  ? "text-[15px]"
                  : size === "lg"
                    ? "text-lg"
                    : "text-xl"
            }`}
          >
            MAB
            <span className="text-[var(--mx-primary)]">X</span>
            CHANGE
          </span>
          {showTagline && (
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--mx-text-soft)]">
              Trade · Invest · Grow
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex" aria-label="MABXCHANGE home">
        {content}
      </Link>
    );
  }

  return content;
}
