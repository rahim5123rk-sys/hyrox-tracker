import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

interface RadarChartProps {
  data: number[];   // Values 0-100
  labels: string[]; // ["SPEED", "POWER", etc]
  size?: number;
  fillColor?: string;
  strokeColor?: string;
  labelColor?: string;
}

export const RadarChart = ({ 
  data, 
  labels, 
  size = 200, 
  fillColor = "rgba(50, 215, 75, 0.4)", 
  strokeColor = "#32D74B", 
  labelColor = "#fff" 
}: RadarChartProps) => {
  
  const radius = size / 2;
  const center = size / 2;
  const angleSlice = (Math.PI * 2) / data.length;
  
  // Grid levels (33%, 66%, 100%)
  const gridLevels = [0.3, 0.6, 0.9]; 

  const getXY = (factor: number, i: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
        x: center + radius * factor * Math.cos(angle),
        y: center + radius * factor * Math.sin(angle)
    };
  };

  const pointsString = (points: {x: number, y: number}[]) => {
      return points.map(p => `${p.x},${p.y}`).join(' ');
  };

  // Calculate Data Shape
  const shapePoints = data.map((val, i) => {
      const factor = Math.min(Math.max(val, 0), 100) / 100; // Normalize 0-1
      return getXY(factor, i);
  });

  return (
    <View style={{ width: size + 60, height: size + 60, justifyContent: 'center', alignItems: 'center' }}>
      <Svg height={size + 60} width={size + 60}>
        <G x={30} y={30}>
            {/* 1. DRAW WEB (GRID) */}
            {gridLevels.map((level, i) => (
                <Polygon
                    key={`grid-${i}`}
                    points={pointsString(data.map((_, idx) => getXY(level, idx)))}
                    stroke="#333"
                    strokeWidth="1"
                    fill="none"
                />
            ))}

            {/* 2. DRAW AXES */}
            {data.map((_, i) => {
                const p = getXY(1, i);
                return (
                    <Line
                        key={`axis-${i}`}
                        x1={center} y1={center}
                        x2={p.x} y2={p.y}
                        stroke="#333"
                        strokeWidth="1"
                    />
                );
            })}

            {/* 3. DRAW DATA SHAPE */}
            <Polygon
                points={pointsString(shapePoints)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="2"
                fillOpacity={0.5}
            />

            {/* 4. DRAW JOINTS (DOTS) */}
            {shapePoints.map((p, i) => (
                <Circle
                    key={`dot-${i}`}
                    cx={p.x} cy={p.y}
                    r="3"
                    fill="#fff"
                    stroke={strokeColor}
                    strokeWidth="1"
                />
            ))}

            {/* 5. LABELS */}
            {labels.map((label, i) => {
                const p = getXY(1.2, i); // Push label out 20%
                return (
                    <SvgText
                        key={`label-${i}`}
                        x={p.x}
                        y={p.y}
                        fill={labelColor}
                        fontSize="10"
                        fontWeight="900"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {label}
                    </SvgText>
                );
            })}
        </G>
      </Svg>
    </View>
  );
};