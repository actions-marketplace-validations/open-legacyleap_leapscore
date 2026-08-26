/*
 * Dial gauge — the report's headline instrument. Color = tier band only;
 * the arc fills to the score and the needle reads it. Static SVG, no runtime
 * deps, renders client-agnostically.
 */

import type { TierColor } from "@/lib/scoring";

const TIER_COLOR_VAR: Record<TierColor, string> = {
  healthy: "var(--tier-healthy)",
  moderate: "var(--tier-moderate)",
  high: "var(--tier-high)",
  critical: "var(--tier-critical)",
};

/** map score (0–100) onto the 180° arc, clamp */
function angleFor(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return -90 + (clamped / 100) * 180;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function DialGauge({
  score,
  tierColor,
  label,
}: {
  score: number;
  tierColor: TierColor;
  label: string;
}) {
  const cx = 100;
  const cy = 100;
  const r = 78;
  const start = polar(cx, cy, r, -90);
  const end = polar(cx, cy, r, angleFor(score));
  const needleEnd = polar(cx, cy, r - 16, angleFor(score));
  const color = TIER_COLOR_VAR[tierColor];
  // end caps: one tick of the band sits at the reading
  const tickP = polar(cx, cy, r + 10, angleFor(score));

  return (
    <svg
      viewBox="0 0 200 118"
      role="img"
      aria-label={`${label}: ${score} out of 100`}
      className="h-auto w-full max-w-[220px]"
    >
      <defs>
        <linearGradient
          id={`g-${label.replace(/\s+/g, "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* track */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${2 * cx - start.x} ${start.y}`}
        fill="none"
        stroke="var(--hairline)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* filled arc */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        opacity={score > 0 ? 0.9 : 0.3}
      />
      {/* soft fill under the reading */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y} L ${cx} ${cy} Z`}
        fill={`url(#g-${label.replace(/\s+/g, "")})`}
        opacity="0.35"
      />
      {/* needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="var(--foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* reading tick on the band */}
      <line
        x1={tickP.x}
        y1={tickP.y}
        x2={cx}
        y2={cy - 4}
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <circle cx={cx} cy={cy} r="3.5" fill="var(--foreground)" />
      {/* scale labels */}
      <text x="8" y="110" className="fill-faint font-mono text-[10px]">
        0
      </text>
      <text x="180" y="110" className="fill-faint font-mono text-[10px]">
        100
      </text>
    </svg>
  );
}
