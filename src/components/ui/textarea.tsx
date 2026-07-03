import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border-strong bg-surface-card px-3 py-2 text-base text-text-primary shadow-soft transition-colors duration-150 ease-out",
        "placeholder:text-text-tertiary",
        "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
