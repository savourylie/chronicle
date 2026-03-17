"use client";

import { motion, useReducedMotion } from "framer-motion";

const shapes = [
  { type: "circle", color: "var(--secondary)", top: "12%", left: "8%", size: 14, delay: 0 },
  { type: "triangle", color: "var(--tertiary)", top: "25%", right: "6%", size: 16, delay: 0.5 },
  { type: "square", color: "var(--quaternary)", top: "60%", left: "5%", size: 12, delay: 1 },
  { type: "circle", color: "var(--tertiary)", top: "75%", right: "10%", size: 10, delay: 1.5 },
  { type: "triangle", color: "var(--secondary)", top: "40%", left: "92%", size: 14, delay: 0.8 },
  { type: "square", color: "var(--quaternary)", top: "85%", left: "15%", size: 11, delay: 1.2 },
] as const;

function ShapeSvg({ type, color, size }: { type: string; color: string; size: number }) {
  switch (type) {
    case "circle":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" fill={color} />
        </svg>
      );
    case "triangle":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <polygon points="8,1 15,15 1,15" fill={color} />
        </svg>
      );
    case "square":
      return (
        <svg width={size} height={size} viewBox="0 0 16 16">
          <rect x="1" y="1" width="14" height="14" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export function Decorations() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Confetti shapes */}
      {shapes.map((shape, i) => {
        const position: React.CSSProperties = {
          position: "absolute",
          top: shape.top,
          ...(("left" in shape && shape.left) ? { left: shape.left } : {}),
          ...(("right" in shape && shape.right) ? { right: shape.right } : {}),
          opacity: 0.25,
        };

        if (prefersReducedMotion) {
          return (
            <div key={i} className="hidden md:block" style={position}>
              <ShapeSvg type={shape.type} color={shape.color} size={shape.size} />
            </div>
          );
        }

        return (
          <motion.div
            key={i}
            className="hidden md:block"
            style={position}
            animate={{
              y: [0, -6, 0],
              rotate: [0, shape.type === "square" ? 15 : -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay,
            }}
          >
            <ShapeSvg type={shape.type} color={shape.color} size={shape.size} />
          </motion.div>
        );
      })}
    </div>
  );
}
