"use client";

import { motion, useSpring, useTransform } from "motion/react";

type AnimatedCounterProps = {
  value: number;
  format?: "number" | "currency";
  duration?: number;
  className?: string;
  decimals?: number;
};

export function AnimatedCounter({
  value,
  format = "number",
  duration = 1,
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const safeValue = Math.max(0, Number(value) || 0);
  const spring = useSpring(safeValue, {
    duration: duration * 1000,
    bounce: 0,
    stiffness: 100,
    damping: 20,
  });

  const display = useTransform(spring, (current) => {
    const num = Math.max(0, current);
    
    if (format === "currency") {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
        maximumFractionDigits: 2,
      }).format(num);
    }
    
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals));
  });

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {display}
    </motion.span>
  );
}