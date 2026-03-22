"use client";

/**
 * A row of player silhouette figures showing gather occupancy.
 * Filled figures = occupied slots, outlined = empty slots.
 */
export function PlayerFigures({
  total,
  filled,
  prevFilled = 0,
  variant = "primary",
  className = "",
}: {
  total: number;
  filled: number;
  prevFilled?: number;
  variant?: "primary" | "destructive" | "accent";
  className?: string;
}) {
  const fillColor =
    variant === "destructive"
      ? "oklch(0.62 0.22 25)"
      : variant === "accent"
      ? "oklch(0.75 0.16 70)"
      : "oklch(0.68 0.17 145)";

  const emptyColor = "oklch(0.30 0.015 90)";

  return (
    <div className={`flex gap-0.5 items-end ${className}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isNew = isFilled && i >= prevFilled;

        return (
          <svg
            key={i}
            viewBox="0 0 20 32"
            className={`flex-1 max-w-[24px] h-6 transition-all duration-300 ${
              isNew ? "animate-slot-pop" : ""
            }`}
            style={isNew ? { animationDelay: `${(i - prevFilled) * 50}ms` } : undefined}
            aria-hidden="true"
          >
            {/* Head */}
            <circle
              cx="10"
              cy="7"
              r="4.5"
              fill={isFilled ? fillColor : "none"}
              stroke={isFilled ? fillColor : emptyColor}
              strokeWidth={isFilled ? 0 : 1.5}
            />
            {/* Body */}
            <path
              d="M10 13 C4 13 2 18 2 22 L2 28 C2 29.5 3 30 4 30 L16 30 C17 30 18 29.5 18 28 L18 22 C18 18 16 13 10 13Z"
              fill={isFilled ? fillColor : "none"}
              stroke={isFilled ? fillColor : emptyColor}
              strokeWidth={isFilled ? 0 : 1.5}
            />
          </svg>
        );
      })}
    </div>
  );
}
