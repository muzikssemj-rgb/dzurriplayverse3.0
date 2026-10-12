"use client";

import { useState } from "react";

export type Bar = { key: string; label: string; value: number; tooltip: string };

/**
 * Carta bar satu siri (SVG) dengan tooltip hover/sentuh.
 * Satu warna sahaja (identiti diberi oleh tajuk carta), grid lembut, hujung bar bulat 4px.
 */
export function BarChart({
  bars,
  height = 180,
  color = "#22D3EE",
  labelEvery = 1,
  ariaLabel,
  width = 720,
}: {
  bars: Bar[];
  height?: number;
  color?: string;
  labelEvery?: number;
  ariaLabel: string;
  width?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const niceMax = niceCeil(max);
  const W = width;
  const H = height;
  const padL = 34;
  const padB = 22;
  const padT = 8;
  const plotW = W - padL - 6;
  const plotH = H - padB - padT;
  const step = plotW / bars.length;
  const bw = Math.max(2, Math.min(28, step - 2));
  const y = (v: number) => padT + plotH - (v / niceMax) * plotH;
  const ticks = niceMax % 2 === 0 ? [0, niceMax / 2, niceMax] : [0, niceMax];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel} onMouseLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 4} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.08)" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(169,180,214,0.9)">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const x = padL + i * step + (step - bw) / 2;
          const top = y(b.value);
          const h = Math.max(0, padT + plotH - top);
          return (
            <g key={b.key}>
              {h > 0 && (
                <path
                  d={roundedTop(x, top, bw, h, Math.min(4, bw / 2, h))}
                  fill={color}
                  opacity={active === null || active === i ? 1 : 0.45}
                />
              )}
              {/* kawasan sasaran lebih besar daripada bar */}
              <rect
                x={padL + i * step}
                y={padT}
                width={step}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
              />
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="rgba(169,180,214,0.9)">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {active !== null && bars[active] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-white/15 bg-space px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${((padL + active * step + step / 2) / W) * 100}%` }}
          role="status"
        >
          {bars[active].tooltip}
        </div>
      )}
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function niceCeil(v: number) {
  if (v <= 5) return Math.max(1, Math.ceil(v));
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
