"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  label?: string;
  error?: string;
  className?: string;
  index?: number;
};

export function FormField({
  children,
  label,
  error,
  className,
  index = 0,
}: FormFieldProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={`form-group${error ? " error" : ""} ${className || ""}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? false : { opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {label && <label>{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
    </motion.div>
  );
}