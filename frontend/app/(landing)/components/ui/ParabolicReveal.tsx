'use client';
import React, { useState, useRef, useMemo } from 'react';

//interactive graph line / UI motion decor

export default function ParabolicReveal() {
  const [progress, setProgress] = useState(0.4);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 600;
  const height = 300;
  const axisY = height / 2; // baseline for axes

  // Curve formula (odd polynomial + sine)
  const curveFunc = (x: number) => {
    const a = 0.00002;
    const sine = 15 * Math.sin(x / 60);
    return height / 2 + a * Math.pow(x - width / 2, 3) + sine;
  };

  // Compute points (clamped)
  const points = useMemo(
    () =>
      Array.from({ length: 150 }, (_, i) => {
        const x = (i / 149) * width;
        const rawY = curveFunc(x);
        const y = Math.min(height - 20, Math.max(20, rawY));
        return [x, y] as [number, number];
      }),
    []
  );

  // Handle
  const handleX = progress * width;
  const rawY = curveFunc(handleX);
  const handleY = Math.min(height - 20, Math.max(20, rawY));

  // Split at handle
  const leftPoints = points.filter(([x]) => x <= handleX);
  const rightPoints = points.filter(([x]) => x > handleX);

  // Make fill paths (close to axis line, not bottom edge)
  const makePath = (pts: [number, number][]) =>
    'M ' +
    pts.map(([x, y]) => `${x},${y}`).join(' L ') +
    ` L ${pts[pts.length - 1]?.[0] ?? 0},${axisY} L ${pts[0]?.[0] ?? 0},${axisY} Z`;

  const leftPath = makePath(leftPoints);
  const rightPath = makePath(rightPoints);

  // Drag
  const onDrag = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const newProgress = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / width)
    );
    setProgress(newProgress);
  };

  // Tick marks
  const xTicks = 10;
  const yTicks = 4;
  const tickLength = 6;

  return (
    <div className="flex items-center justify-center py-16">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={(e) => e.buttons === 1 && onDrag(e)}
        className="rounded-xl shadow-lg bg-gray-900/40 backdrop-blur-md"
      >
        {/* === Axes === */}
        <line
          x1={0}
          y1={axisY}
          x2={width}
          y2={axisY}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={height}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />

        {/* === Tick marks (X-axis) === */}
        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const x = (i / xTicks) * width;
          return (
            <line
              key={`x${i}`}
              x1={x}
              y1={axisY - tickLength / 2}
              x2={x}
              y2={axisY + tickLength / 2}
              stroke="rgba(255,215,0,0.4)"
              strokeWidth={1}
            />
          );
        })}

        {/* === Tick marks (Y-axis) === */}
        {Array.from({ length: yTicks * 2 + 1 }, (_, i) => {
          const y = (i / (yTicks * 2)) * height;
          return (
            <line
              key={`y${i}`}
              x1={width / 2 - tickLength / 2}
              x2={width / 2 + tickLength / 2}
              y1={y}
              y2={y}
              stroke="rgba(255,215,0,0.4)"
              strokeWidth={1}
            />
          );
        })}

        {/* === Left (bright gold) fill === */}
        <path d={leftPath} fill="rgba(255,215,0,0.5)" stroke="none" />

        {/* === Right (muted gray-gold) fill === */}
        <path d={rightPath} fill="rgba(180,160,60,0.25)" stroke="none" />

        {/* === Curve line === */}
        <path
          d={'M ' + points.map(([x, y]) => `${x},${y}`).join(' L ')}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="2"
          fill="none"
        />

        {/* === Handle === */}
        <circle
          cx={handleX}
          cy={handleY}
          r={10}
          fill="#fff"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => onDrag(e)}
        />
      </svg>
    </div>
  );
}
