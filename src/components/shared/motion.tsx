"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FadeInProps {
  /** Stagger index → small incremental delay. */
  index?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Card/section entrance: fade + 8px slide-up over 150ms. Honors
 * prefers-reduced-motion (renders with no transform/opacity animation).
 */
export function FadeIn({ index = 0, className, children }: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut", delay: index * 0.03 }}
    >
      {children}
    </motion.div>
  );
}

/** Bounce a child when `active` toggles true (e.g. checkbox ticked). */
export function BounceOnActive({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={className}
      animate={reduce || !active ? { scale: 1 } : { scale: [1, 1.25, 1] }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}
