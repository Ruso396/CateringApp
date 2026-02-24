import React from 'react';
import Svg, { Path, Polyline, Line } from 'react-native-svg';

interface ExportIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const ExportIcon: React.FC<ExportIconProps> = ({
  size = 24,
  color = '#000000',
  strokeWidth = 2.5, // 👈 Bold effect
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Polyline
        points="15 3 21 3 21 9"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21,13v7a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V4A1,1,0,0,1,4,3h7"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="11"
        y1="13"
        x2="21"
        y2="3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};