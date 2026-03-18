"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import * as d3 from "d3";

interface DensityChartProps {
  dates: Date[];
  width: number;
  height: number;
  focusDateRange: [Date, Date] | null;
  brushDateRange: [Date, Date] | null;
  onBrushChange: (range: [string, string] | undefined) => void;
}

const MARGIN = { top: 8, right: 16, bottom: 28, left: 16 };

export function DensityChart({
  dates,
  width,
  height,
  focusDateRange,
  brushDateRange,
  onBrushChange,
}: DensityChartProps) {
  const brushRef = useRef<SVGGElement>(null);
  const isProgrammaticRef = useRef(false);
  const brushInstanceRef = useRef<d3.BrushBehavior<unknown> | null>(null);

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // D3 scales and binned data
  const { xScale, yScale, areaPath, bins, ticks } = useMemo(() => {
    const extent = d3.extent(dates) as [Date, Date];
    const x = d3.scaleTime().domain(extent).range([0, innerWidth]);
    const bucketCount = Math.max(20, Math.min(80, Math.round(innerWidth / 8)));

    const binner = d3
      .bin<Date, Date>()
      .value((d) => d)
      .domain(x.domain() as [Date, Date])
      .thresholds(x.ticks(bucketCount));

    const b = binner(dates);
    const maxCount = d3.max(b, (d) => d.length) ?? 0;
    const y = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);

    const area = d3
      .area<d3.Bin<Date, Date>>()
      .x((d) => x(d.x0 ?? extent[0]))
      .y0(innerHeight)
      .y1((d) => y(d.length))
      .curve(d3.curveBasis);

    const path = area(b) ?? "";
    const axisTicks = x.ticks(Math.max(3, Math.round(innerWidth / 120)));

    return { xScale: x, yScale: y, areaPath: path, bins: b, ticks: axisTicks };
  }, [dates, innerWidth, innerHeight]);

  // Brush end handler
  const handleBrushEnd = useCallback(
    (event: d3.D3BrushEvent<unknown>) => {
      if (isProgrammaticRef.current) return;
      const selection = event.selection as [number, number] | null;
      if (!selection) {
        onBrushChange(undefined);
        return;
      }
      const [x0, x1] = selection;
      const d0 = xScale.invert(x0);
      const d1 = xScale.invert(x1);
      onBrushChange([d0.toISOString(), d1.toISOString()]);
    },
    [xScale, onBrushChange],
  );

  // Attach d3-brush imperatively
  useEffect(() => {
    if (!brushRef.current) return;

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", handleBrushEnd);

    brushInstanceRef.current = brush;
    const g = d3.select(brushRef.current);
    g.call(brush);

    // Style the brush selection
    g.select(".selection")
      .attr("fill", "var(--accent)")
      .attr("fill-opacity", 0.15)
      .attr("stroke", "var(--accent)")
      .attr("stroke-width", 2);

    return () => {
      g.on(".brush", null);
    };
  }, [innerWidth, innerHeight, handleBrushEnd]);

  // Sync brush position from external store changes
  useEffect(() => {
    if (!brushRef.current || !brushInstanceRef.current) return;

    isProgrammaticRef.current = true;
    const g = d3.select(brushRef.current);

    if (brushDateRange) {
      const x0 = xScale(brushDateRange[0]);
      const x1 = xScale(brushDateRange[1]);
      g.call(brushInstanceRef.current.move, [x0, x1]);
    } else {
      g.call(brushInstanceRef.current.move, null);
    }

    // Reset flag after the event loop processes the brush move
    requestAnimationFrame(() => {
      isProgrammaticRef.current = false;
    });
  }, [brushDateRange, xScale]);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Grid lines */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={xScale(tick)}
            x2={xScale(tick)}
            y1={0}
            y2={innerHeight}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="2,3"
          />
        ))}

        {/* Focus highlight */}
        {focusDateRange && (
          <rect
            x={xScale(focusDateRange[0])}
            y={0}
            width={Math.max(
              0,
              xScale(focusDateRange[1]) - xScale(focusDateRange[0]),
            )}
            height={innerHeight}
            fill="var(--accent)"
            fillOpacity={0.08}
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Density area */}
        <path
          d={areaPath}
          fill="var(--accent)"
          fillOpacity={0.2}
          stroke="var(--accent)"
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />

        {/* Brush overlay */}
        <g ref={brushRef} />

        {/* Axis tick labels */}
        {ticks.map((tick, i) => (
          <text
            key={i}
            x={xScale(tick)}
            y={innerHeight + 18}
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-body)"
          >
            {d3.timeFormat("%b %d")(tick)}
          </text>
        ))}
      </g>
    </svg>
  );
}
