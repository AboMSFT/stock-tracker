interface SparklineProps {
  prices: number[];
  positive: boolean;
}

export function Sparkline({ prices, positive }: SparklineProps) {
  if (prices.length < 2) return null;

  const W = 100;
  const H = 36;
  const pad = 2;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - pad - ((p - min) / range) * (H - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`;

  const color = positive ? '#4ade80' : '#ff4d6a';
  const fill = positive ? 'rgba(0,200,127,0.1)' : 'rgba(255,77,106,0.1)';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="36"
      preserveAspectRatio="none"
      className="sparkline"
      aria-hidden="true"
    >
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
