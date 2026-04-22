import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SparklineProps {
  prices: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export function Sparkline({ prices, positive, width = 150, height = 36 }: SparklineProps) {
  if (prices.length < 2) return null;

  const pad = 2;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - pad - ((p - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = pts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
    .join(' ');

  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  const color = positive ? '#00c87f' : '#ff4d6a';
  const fill = positive ? 'rgba(0,200,127,0.1)' : 'rgba(255,77,106,0.1)';

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path d={fillPath} fill={fill} />
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
