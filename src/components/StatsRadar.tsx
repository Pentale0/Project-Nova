import React, { useState } from 'react';
import { StatInfo } from '../types';
import { playHoverSound, playSelectSound } from '../utils/audio';
import { Plus, Eye, Sparkles } from 'lucide-react';

export type GraphShape = 'diamond' | 'hexagon' | 'star' | 'circular' | 'bars';

interface StatsRadarProps {
  stats: Record<string, StatInfo>;
  size?: number;
  onQuickLog?: (statKey: any, units: number) => void;
  onSelectStat?: (statKey: string) => void;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({
  stats,
  size = 280,
  onQuickLog,
  onSelectStat,
}) => {
  const [activeShape, setActiveShape] = useState<GraphShape>('diamond');
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const statList: StatInfo[] = [
    stats.academics,
    stats.vitality,
    stats.culture,
    stats.memories,
  ].filter(Boolean);

  const center = size / 2;
  const maxRadius = size * 0.38;

  // 4 primary angles: Top, Right, Bottom, Left
  const primaryAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  // 6 angles for hexagon mode (Academics, Focus, Vitality, Culture, Consistency, Memories)
  const hexAngles = [
    -Math.PI / 2,
    -Math.PI / 6,
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (-5 * Math.PI) / 6,
  ];

  // 8 angles for star mode
  const starAngles = Array.from({ length: 8 }, (_, i) => -Math.PI / 2 + (i * Math.PI) / 4);

  // Get ratio normalized between 0.15 and 1.0
  const getRatio = (stat: StatInfo) => {
    return Math.min(1.0, Math.max(0.18, (stat.rank - 0.2 + (stat.percent / 100) * 0.2) / 5));
  };

  const getCoordinates = (angle: number, ratio: number) => {
    const r = ratio * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Compute points based on selected shape
  let polygonPoints = '';
  const nodePoints: { stat: StatInfo; x: number; y: number; angle: number }[] = [];

  if (activeShape === 'diamond' || activeShape === 'circular') {
    polygonPoints = statList
      .map((stat, i) => {
        const ratio = getRatio(stat);
        const coords = getCoordinates(primaryAngles[i], ratio);
        nodePoints.push({ stat, x: coords.x, y: coords.y, angle: primaryAngles[i] });
        return `${coords.x},${coords.y}`;
      })
      .join(' ');
  } else if (activeShape === 'hexagon') {
    // 6-axis polygon: 4 stats + 2 derived metrics (Focus & Consistency)
    const consistencyRatio = (getRatio(stats.academics) + getRatio(stats.vitality)) / 2;
    const focusRatio = (getRatio(stats.culture) + getRatio(stats.memories)) / 2;
    const values = [
      { stat: stats.academics, ratio: getRatio(stats.academics) },
      { stat: stats.academics, ratio: consistencyRatio, isVirtual: true },
      { stat: stats.vitality, ratio: getRatio(stats.vitality) },
      { stat: stats.culture, ratio: getRatio(stats.culture) },
      { stat: stats.culture, ratio: focusRatio, isVirtual: true },
      { stat: stats.memories, ratio: getRatio(stats.memories) },
    ];
    polygonPoints = values
      .map((item, i) => {
        const coords = getCoordinates(hexAngles[i], item.ratio);
        if (!item.isVirtual) {
          nodePoints.push({ stat: item.stat, x: coords.x, y: coords.y, angle: hexAngles[i] });
        }
        return `${coords.x},${coords.y}`;
      })
      .join(' ');
  } else if (activeShape === 'star') {
    // 8-point stellated polygon
    polygonPoints = starAngles
      .map((angle, i) => {
        const stat = statList[i % 4];
        const isSpike = i % 2 === 0;
        const baseRatio = getRatio(stat);
        const ratio = isSpike ? baseRatio : baseRatio * 0.55;
        const coords = getCoordinates(angle, ratio);
        if (isSpike) {
          nodePoints.push({ stat, x: coords.x, y: coords.y, angle });
        }
        return `${coords.x},${coords.y}`;
      })
      .join(' ');
  }

  const activeStatObj = statList.find((s) => s.key === hoveredStat);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Shape Selector Bar */}
      <div className="w-full flex items-center justify-between gap-1 mb-3 pb-2 border-b-2 border-white/20">
        <span className="text-[11px] font-p3r tracking-wider text-white">
          RADAR GEOMETRY:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'diamond', label: 'DIAMOND' },
              { id: 'hexagon', label: 'HEXAGON' },
              { id: 'star', label: 'STAR' },
              { id: 'circular', label: 'CIRCULAR' },
              { id: 'bars', label: 'BARS' },
            ] as const
          ).map((shape) => (
            <button
              key={shape.id}
              onClick={() => {
                playSelectSound();
                setActiveShape(shape.id);
              }}
              onMouseEnter={playHoverSound}
              className={`px-2 py-1 text-[10px] font-p3r uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeShape === shape.id
                  ? 'bg-white text-[#0047D4] font-black shadow-[2px_2px_0px_#001F5C]'
                  : 'bg-[#0038A8] text-white hover:bg-[#0055FF] border border-white/30'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Graph Area */}
      {activeShape === 'bars' ? (
        /* Bar Equalizer Mode */
        <div className="w-full py-4 px-2 space-y-3">
          {statList.map((stat) => (
            <div
              key={stat.key}
              onMouseEnter={() => setHoveredStat(stat.key)}
              onMouseLeave={() => setHoveredStat(null)}
              onClick={() => onSelectStat && onSelectStat(stat.key)}
              className="cursor-pointer group"
            >
              <div className="flex justify-between items-center text-xs font-p3r mb-1">
                <span className="text-white group-hover:text-[#FFFFFF] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#FFFFFF] inline-block transform rotate-45"></span>
                  {stat.name} ({stat.rankName})
                </span>
                <span className="text-white font-mono text-[11px]">
                  {stat.xp}/{stat.nextThreshold} XP ({stat.percent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-[#002673] border-2 border-white/60 p-0.5 relative overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.max(8, stat.percent)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Radial SVG Radar / Star / Hexagon / Circular */
        <div className="relative flex items-center justify-center my-1 select-none">
          <svg width={size} height={size} className="overflow-visible">
            <defs>
              <linearGradient id="p3rRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0055FF" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Grid Lines based on shape */}
            {[0.25, 0.5, 0.75, 1.0].map((step, idx) => {
              if (activeShape === 'circular') {
                return (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={maxRadius * step}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={idx === 3 ? 2 : 1}
                    strokeOpacity={idx === 3 ? 0.7 : 0.25}
                    strokeDasharray={idx < 3 ? '3 3' : 'none'}
                  />
                );
              } else if (activeShape === 'hexagon') {
                const hexPts = hexAngles
                  .map((ang) => {
                    const r = maxRadius * step;
                    return `${center + r * Math.cos(ang)},${center + r * Math.sin(ang)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={idx}
                    points={hexPts}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={idx === 3 ? 2 : 1}
                    strokeOpacity={idx === 3 ? 0.7 : 0.25}
                    strokeDasharray={idx < 3 ? '3 3' : 'none'}
                  />
                );
              } else {
                // Diamond / Star grid
                const gridPts = primaryAngles
                  .map((ang) => {
                    const r = maxRadius * step;
                    return `${center + r * Math.cos(ang)},${center + r * Math.sin(ang)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={idx}
                    points={gridPts}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={idx === 3 ? 2 : 1}
                    strokeOpacity={idx === 3 ? 0.7 : 0.25}
                    strokeDasharray={idx < 3 ? '3 3' : 'none'}
                  />
                );
              }
            })}

            {/* Radial Axis Lines */}
            {(activeShape === 'hexagon' ? hexAngles : primaryAngles).map((ang, idx) => (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={center + maxRadius * Math.cos(ang)}
                y2={center + maxRadius * Math.sin(ang)}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                strokeOpacity={0.4}
              />
            ))}

            {/* Filled Polygon */}
            <polygon
              points={polygonPoints}
              fill="url(#p3rRadarFill)"
              stroke="#FFFFFF"
              strokeWidth={3}
              className="transition-all duration-300"
            />

            {/* Interactive Nodes */}
            {nodePoints.map((node) => {
              const isHovered = hoveredStat === node.stat.key;
              return (
                <g
                  key={node.stat.key}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    playHoverSound();
                    setHoveredStat(node.stat.key);
                  }}
                  onMouseLeave={() => setHoveredStat(null)}
                  onClick={() => onSelectStat && onSelectStat(node.stat.key)}
                >
                  {/* Outer pulse target */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 12 : 7}
                    fill={isHovered ? '#FF0055' : '#FFFFFF'}
                    stroke="#001F5C"
                    strokeWidth={2.5}
                    className="transition-all duration-150"
                  />
                  {/* Inner center dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 4 : 2.5}
                    fill={isHovered ? '#FFFFFF' : '#0047D4'}
                  />
                </g>
              );
            })}

            {/* Axis Labels */}
            <text x={center} y={16} textAnchor="middle" fill="#FFFFFF" className="font-p3r text-[11px] font-black">
              ACADEMICS
            </text>
            <text x={size - 4} y={center + 4} textAnchor="end" fill="#FFFFFF" className="font-p3r text-[11px] font-black">
              VITALITY
            </text>
            <text x={center} y={size - 4} textAnchor="middle" fill="#FFFFFF" className="font-p3r text-[11px] font-black">
              CULTURE
            </text>
            <text x={4} y={center + 4} textAnchor="start" fill="#FFFFFF" className="font-p3r text-[11px] font-black">
              MEMORIES
            </text>
          </svg>
        </div>
      )}

      {/* Interactive Tooltip Card on Node Hover */}
      {activeStatObj && (
        <div className="w-full mt-2 p-2.5 bg-white text-[#001F5C] border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C] flex items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="flex items-center gap-1.5 font-p3r text-xs">
              <span className="bg-[#FF0055] text-white px-1.5 py-0.5 text-[10px]">
                {activeStatObj.rankName}
              </span>
              <strong className="text-sm font-black">{activeStatObj.name}</strong>
              <span className="text-[#0047D4]">({activeStatObj.title})</span>
            </div>
            <div className="text-[10px] font-mono text-[#001F5C]/80">
              {activeStatObj.xp} / {activeStatObj.nextThreshold} XP ({activeStatObj.percent}%)
            </div>
          </div>

          {onQuickLog && (
            <button
              onClick={() => onQuickLog(activeStatObj.key as any, 1)}
              className="px-2.5 py-1 bg-[#0047D4] hover:bg-[#FF0055] text-white font-p3r text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>BOOST +XP</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
