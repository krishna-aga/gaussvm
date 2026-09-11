import { useId } from "react";
import { cdf, pdf } from "../../lib/reference.mjs";

export function Curve({
  remaining,
  probability,
}: {
  remaining: number;
  probability: number;
}) {
  const id = useId().replaceAll(":", "");
  const points = Array.from({ length: 101 }, (_, i) => {
    const z = -3 + i * 0.06,
      p = cdf(z),
      depth = Math.pow(p * (1 - p), 1.5) / pdf(z) / (0.125 / pdf(0));
    return [52 + p * 596, 202 - depth * 145 * Math.sqrt(remaining)] as const;
  });
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  return (
    <svg
      className="curve"
      viewBox="0 0 700 255"
      role="img"
      aria-label={`Illustrative Gaussian liquidity shape with ${Math.round(remaining * 100)} percent lifetime remaining. Not an executable quote.`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#527b5c" stopOpacity=".28" />
          <stop offset="100%" stopColor="#527b5c" stopOpacity=".015" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line
            x1="52"
            x2="648"
            y1={202 - v * 145}
            y2={202 - v * 145}
            stroke="#ccd3cb"
            strokeDasharray="3 6"
          />
          <text x="34" y={207 - v * 145} textAnchor="end">
            {v * 100}
          </text>
        </g>
      ))}
      <path d={`${line} L648,202 L52,202 Z`} fill={`url(#${id})`} />
      <path
        d="M52,57 H648"
        fill="none"
        stroke="#9b8054"
        strokeWidth="2"
        strokeDasharray="7 7"
      />
      <path d={line} fill="none" stroke="#315b41" strokeWidth="3" />
      <line
        x1={52 + 596 * probability}
        x2={52 + 596 * probability}
        y1="36"
        y2="202"
        stroke="#315b41"
        strokeWidth="1"
        strokeDasharray="3 4"
      />
      <circle cx={52 + 596 * probability} cy="202" r="5" fill="#315b41" />
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <text key={p} x={52 + p * 596} y="229" textAnchor="middle">
          {p * 100}%
        </text>
      ))}
      <text x="350" y="253" textAnchor="middle">
        YES probability
      </text>
    </svg>
  );
}
