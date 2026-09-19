interface LineChartProps {
  data: { label: string; value: number }[];
}

export function LineChart({ data }: LineChartProps) {
  const W = 600;
  const H = 200;
  const padL = 16;
  const padR = 16;
  const padT = 16;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (data.length === 0) {
    return <div className="muted">No data</div>;
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - ((d.value - min) / range) * innerH,
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`;
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Line chart">
      <defs>
        <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.22 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#line-area)" />
      <path d={line} fill="none" className="chart-line" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="chart-dot" />
      ))}
      {data.map((d, i) =>
        i % labelEvery === 0 ? (
          <text key={i} x={padL + i * stepX} y={H - 6} textAnchor="middle" className="chart-label">
            {d.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
