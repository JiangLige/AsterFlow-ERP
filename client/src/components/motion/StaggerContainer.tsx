"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: "vertical" | "horizontal";
};

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  initialDelay = 0,
  direction = "vertical",
}: StaggerContainerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
    >
      {reduce
        ? children
        : Array.isArray(children)
          ? children.map((child, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: direction === "vertical" ? { opacity: 0, y: 16 } : { opacity: 0, x: 16 },
                  visible: {
                    opacity: 1,
                    ...(direction === "vertical" ? { y: 0 } : { x: 0 }),
                    transition: {
                      duration: 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
                }}
              >
                {child}
              </motion.div>
            ))
          : children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}