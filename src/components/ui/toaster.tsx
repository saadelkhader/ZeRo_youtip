"use client";

import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toaster. Bottom-center on mobile, bottom-right on desktop. Styled to
 * the ZeRo palette — calm, never an aggressive red.
 */
export function Toaster() {
  const [position, setPosition] = React.useState<
    "bottom-center" | "bottom-right"
  >("bottom-right");

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () =>
      setPosition(mq.matches ? "bottom-right" : "bottom-center");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <SonnerToaster
      position={position}
      duration={3000}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-card !text-text-primary !border !border-border-light !shadow-elevated !rounded-lg !text-sm",
          title: "!text-text-primary !font-medium",
          description: "!text-text-secondary",
          success: "!text-success",
          info: "!text-warning",
        },
      }}
    />
  );
}
