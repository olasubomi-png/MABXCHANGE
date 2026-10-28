import { MabLogoIcon } from "./brand-mark";

type BrandLoaderProps = {
  /** Optional status text under the mark */
  label?: string;
  /** Full-screen centered overlay vs inline block */
  fullScreen?: boolean;
  className?: string;
};

/**
 * Lightweight branded loading indicator.
 * Respects prefers-reduced-motion via CSS.
 */
export function BrandLoader({
  label = "Loading MABXCHANGE…",
  fullScreen = false,
  className = "",
}: BrandLoaderProps) {
  const body = (
    <div
      className={`mx-brand-loader flex flex-col items-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mx-brand-loader-glow relative">
        <MabLogoIcon size={56} glowing />
      </div>
      <div className="mx-brand-loader-bar" aria-hidden="true" />
      {label && (
        <p className="text-xs font-medium tracking-wide text-[var(--mx-text-muted)]">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-[var(--mx-bg)]">
        {body}
      </div>
    );
  }

  return body;
}
