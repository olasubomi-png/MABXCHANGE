import Link from "next/link";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showTagline?: boolean;
  href?: string | null;
  className?: string;
  stacked?: boolean;
  /** Icon only, no dark plate (for compact headers) */
  bare?: boolean;
};

const sizeMap = { sm: 28, md: 36, lg: 52, xl: 72 } as const;

/**
 * Angular electric-blue M with integrated green upward-growth arrow.
 * Matches the MABXCHANGE brand sketches.
 */
export function MabLogoIcon({
  size = 36,
  className = "",
  glowing = false,
  bare = false,
}: {
  size?: number;
  className?: string;
  glowing?: boolean;
  bare?: boolean;
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
          ? { filter: "drop-shadow(0 0 12px rgba(41, 98, 255, 0.6))" }
          : undefined
      }
    >
      {!bare && (
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="16"
          fill="#111827"
          stroke="#263247"
          strokeWidth="1.5"
        />
      )}
      {/* Left leg of M */}
      <path
        d="M12 48 L12 16 L26 36 L32 24"
        stroke="#2962FF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right leg becomes green growth arrow */}
      <path
        d="M32 24 L38 36 L46 18"
        stroke="#2962FF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Green arrow head + shaft rising */}
      <path
        d="M46 18 L46 42"
        stroke="#00C853"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M38 28 L46 16 L54 28"
        stroke="#00C853"
        strokeWidth="5"
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
  bare = false,
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
      <MabLogoIcon size={px} bare={bare} />
      {showWordmark && (
        <span
          className={
            stacked ? "flex flex-col items-center gap-0.5" : "flex flex-col leading-tight"
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
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--mx-text-soft)]">
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
