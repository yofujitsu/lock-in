interface BarChartProps {
  data: { label: string; value: number }[];
  formatValue?: (v: number) => string;
}

export function BarChart({ data, formatValue = (v) => Math.round(v).toString() }: BarChartProps) {
  const W = 600;
  const H = 220;
  const padT = 22;
  const padB = 28;
  const padX = 10;
  const innerH = H - padT - padB;
  const innerW = W - padX * 2;

  if (data.length === 0) {
    return <div className="muted">No data</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 14;
  const barW = (innerW - gap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padX + i * (barW + gap);
        const y = padT + (innerH - h);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} rx={4} className="chart-bar" />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="chart-value">
              {formatValue(d.value)}
            </text>
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="chart-label">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
