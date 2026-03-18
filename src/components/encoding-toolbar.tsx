"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Resize } from "@phosphor-icons/react";

import { useVisualizationStore } from "@/store/visualization-store";
import type { SizeEncoding, ColorEncoding } from "@/types/visualization";
import { SegmentedControl } from "@/components/ui/segmented-control";

const sizeOptions: { value: SizeEncoding; label: string }[] = [
  { value: "linesChanged", label: "Lines" },
  { value: "fileCount", label: "Files" },
  { value: "commitCount", label: "Commits" },
];

const colorOptions: { value: ColorEncoding; label: string }[] = [
  { value: "type", label: "Type" },
  { value: "author", label: "Author" },
  { value: "recency", label: "Recency" },
  { value: "churn", label: "Churn" },
];

export function EncodingToolbar() {
  const sizeEncoding = useVisualizationStore((s) => s.encoding.size);
  const colorEncoding = useVisualizationStore((s) => s.encoding.color);
  const setEncoding = useVisualizationStore((s) => s.setEncoding);

  return (
    <>
      {/* Desktop: inline segmented controls */}
      <div className="hidden items-center gap-2 md:flex">
        <SegmentedControl
          value={sizeEncoding}
          onChange={(v) => setEncoding("size", v)}
          options={sizeOptions}
          icon={<Resize size={14} weight="bold" />}
          label="Size encoding"
        />
        <SegmentedControl
          value={colorEncoding}
          onChange={(v) => setEncoding("color", v)}
          options={colorOptions}
          icon={<Palette size={14} weight="bold" />}
          label="Color encoding"
        />
      </div>

      {/* Mobile: icon buttons with dropdowns */}
      <div className="flex items-center gap-1 md:hidden">
        <MobileDropdown
          icon={<Resize size={16} weight="bold" />}
          label="Size encoding"
          value={sizeEncoding}
          options={sizeOptions}
          onChange={(v) => setEncoding("size", v)}
        />
        <MobileDropdown
          icon={<Palette size={16} weight="bold" />}
          label="Color encoding"
          value={colorEncoding}
          options={colorOptions}
          onChange={(v) => setEncoding("color", v)}
        />
      </div>
    </>
  );
}

function MobileDropdown<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={label}
        className="flex items-center justify-center rounded-md border-2 border-border bg-input p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {icon}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-32 rounded-md border-2 border-border bg-card shadow-hard">
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full px-3 py-2 text-left font-heading text-sm transition-colors hover:bg-muted ${
                    value === option.value
                      ? "font-semibold text-accent"
                      : "text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
