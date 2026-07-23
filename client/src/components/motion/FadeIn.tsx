"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
  once?: boolean;
  style?: React.CSSProperties;
};

const directionOffset = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance,
  className,
  once = true,
  style,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const offset = directionOffset[direction];
  const dist = distance ?? (direction === "none" ? 0 : 24);

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, ...offset, ...(direction !== "none" && dist !== 24 ? { x: offset.x ? dist * Math.sign(offset.x as number) : 0, y: offset.y ? dist * Math.sign(offset.y as number) : 0 } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.3 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}