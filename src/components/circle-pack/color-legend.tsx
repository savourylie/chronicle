import * as d3 from "d3";

import type { ColorEncoding } from "@/types";
import type { ColorContext } from "@/lib/encoding";
import { TYPE_COLOR_MAP, hashAuthorColor } from "@/lib/encoding";

const ENCODING_LABELS: Record<ColorEncoding, string> = {
  type: "Commit Type",
  author: "Author",
  recency: "Recency",
  churn: "Churn",
};

const MAX_AUTHOR_SWATCHES = 8;

export function ColorLegend({
  encoding,
  context,
}: {
  encoding: ColorEncoding;
  context: ColorContext;
}) {
  return (
    <div className="absolute bottom-4 left-4 rounded-lg border-2 border-border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {ENCODING_LABELS[encoding]}
      </p>
      {encoding === "type" && <TypeLegend />}
      {encoding === "author" && <AuthorLegend authors={context.authors} />}
      {encoding === "recency" && <GradientLegend left="Oldest" right="Newest" id="recency-grad" />}
      {encoding === "churn" && <GradientLegend left="Low" right="High" id="churn-grad" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Swatch-based legends
// ---------------------------------------------------------------------------

function TypeLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {Object.entries(TYPE_COLOR_MAP).map(([label, color]) => (
        <Swatch key={label} color={color} label={label} />
      ))}
    </div>
  );
}

function AuthorLegend({ authors }: { authors: string[] }) {
  const visible = authors.slice(0, MAX_AUTHOR_SWATCHES);
  const overflow = authors.length - visible.length;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {visible.map((name) => (
        <Swatch key={name} color={hashAuthorColor(name)} label={name} />
      ))}
      {overflow > 0 && (
        <span className="text-xs text-muted-foreground">+{overflow} more</span>
      )}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Gradient-based legends
// ---------------------------------------------------------------------------

function GradientLegend({
  left,
  right,
  id,
}: {
  left: string;
  right: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <svg width={120} height={10} className="rounded-sm">
        <defs>
          <linearGradient id={id}>
            {Array.from({ length: 10 }, (_, i) => {
              const t = i / 9;
              return (
                <stop
                  key={i}
                  offset={`${t * 100}%`}
                  stopColor={gradientColor(id, t)}
                />
              );
            })}
          </linearGradient>
        </defs>
        <rect width={120} height={10} fill={`url(#${id})`} />
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

function gradientColor(id: string, t: number): string {
  if (id === "recency-grad") {
    return d3.interpolateCool(t);
  }
  return d3.interpolateReds(t);
}
