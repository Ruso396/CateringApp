import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface ThreeDotsIconProps {
  size?: number;
  color?: string;
}

export function ThreeDotsIcon({ size = 24, color = '#6B7280' }: ThreeDotsIconProps) {
  const r = 2;
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={c} cy={6} r={r} fill={color} />
      <Circle cx={c} cy={12} r={r} fill={color} />
      <Circle cx={c} cy={18} r={r} fill={color} />
    </Svg>
  );
}
