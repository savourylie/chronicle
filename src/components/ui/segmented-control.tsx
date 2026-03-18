"use client";

import { motion, useReducedMotion } from "framer-motion";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  icon?: React.ReactNode;
  label?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  icon,
  label,
}: SegmentedControlProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1.5 rounded-full border-2 border-border bg-muted/50 p-0.5"
    >
      {icon && (
        <>
          <span className="flex shrink-0 items-center pl-1.5 text-muted-foreground">
            {icon}
          </span>
          <span className="h-4 w-px bg-border" />
        </>
      )}
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className="relative rounded-full px-2.5 py-1 font-heading text-xs font-medium transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId={label ?? "segmented"}
                className="absolute inset-0 rounded-full bg-accent shadow-[2px_2px_0_0] shadow-foreground/20"
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0.2, duration: 0.35 }
                }
              />
            )}
            <span
              className={`relative z-10 ${
                isActive
                  ? "text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
