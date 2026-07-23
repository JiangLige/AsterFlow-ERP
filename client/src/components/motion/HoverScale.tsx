"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type HoverScaleProps = {
  children: ReactNode;
  className?: string;
  scale?: number;
  duration?: number;
};

export function HoverScale({
  children,
  className,
  scale = 1.02,
  duration = 0.2,
}: HoverScaleProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration, type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}