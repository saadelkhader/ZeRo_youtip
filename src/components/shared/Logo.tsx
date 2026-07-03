import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  /** Stack the subtitle under "ZeRo" instead of inline. */
  stacked?: boolean;
}

/**
 * Pure-typography wordmark: "ZeRo" (semibold, primary) + "youtip"
 * (normal, tertiary), separated by a thin space. No image.
 */
export function Logo({ className, stacked = false }: LogoProps) {
  return (
    <span
      className={cn(
        "select-none leading-none tracking-tight",
        stacked ? "flex flex-col gap-0.5" : "inline-flex items-baseline gap-1",
        className,
      )}
    >
      <span className="text-xl font-semibold text-text-primary">ZeRo</span>
      <span
        className={cn(
          "font-normal text-text-tertiary",
          stacked ? "text-xs tracking-wide" : "text-md",
        )}
      >
        youtip
      </span>
    </span>
  );
}
