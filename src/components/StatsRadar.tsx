import React, { useEffect, useRef, useState } from 'react';
import { StatInfo, StatKey } from '../types';
import { playHoverSound, playSelectSound } from '../utils/audio';
import { calculateRankDetails, ROMAN_RANKS } from '../utils/xp';
import { Plus, Sparkles } from 'lucide-react';

export type GraphShape = 'auto' | 'diamond' | 'hexagon' | 'star' | 'circular' | 'bars';

interface StatsRadarProps {
  stats: Record<string, StatInfo>;
  size?: number;
  history?: Record<StatKey, number[]>;
  onQuickLog?: (statKey: any, units: number) => void;
  onSelectStat?: (statKey: string) => void;
}

const STAT_ORDER: StatKey[] = ['academics', 'vitality', 'culture', 'memories'];

// Rings are spaced so each one lines up with a rank band (rank N sits on ring N).
const RING_STEPS = [0.2, 0.4, 0.6, 0.8, 1.0];

// Axis layouts per geometry. Diamond and Circular share the 4-axis layout.
const PRIMARY_ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const HEX_ANGLES = [
  -Math.PI / 2,
  -Math.PI / 6,
  Math.PI / 6,
  Math.PI / 2,
  (5 * Math.PI) / 6,
  (-5 * Math.PI) / 6,
];
const STAR_ANGLES = Array.from({ length: 8 }, (_, i) => -Math.PI / 2 + (i * Math.PI) / 4);

// Index of each vertex that maps to a real stat (the rest are derived/spikes).
const NODE_INDICES: Record<string, number[]> = {
  diamond: [0, 1, 2, 3],
  circular: [0, 1, 2, 3],
  hexagon: [0, 2, 3, 5],
  star: [0, 2, 4, 6],
};

const MANEUVER_SHAPES: GraphShape[] = ['diamond', 'hexagon', 'star', 'circular', 'bars'];

/** Rank I..V climb the geometry ladder: Diamond -> Hexagon -> Star -> Circular -> Bars. */
function shapeForRank(rank: number): GraphShape {
  return MANEUVER_SHAPES[Math.min(Math.max(rank, 1), MANEUVER_SHAPES.length) - 1];
}

const clampRatio = (n: number) => Math.min(1.0, Math.max(0.18, n));

/** Rank bands are a pure function of XP, so history snapshots map to ratios directly. */
function ratioFromXp(xp: number): number {
  const { rank, percent } = calculateRankDetails(xp, 'academics');
  return clampRatio((rank - 0.2 + (percent / 100) * 0.2) / 5);
}

const ratioFromStat = (stat: StatInfo) => ratioFromXp(stat.xp);

function anglesFor(shape: GraphShape): number[] {
  if (shape === 'hexagon') return HEX_ANGLES;
  if (shape === 'star') return STAR_ANGLES;
  return PRIMARY_ANGLES;
}

/** Expand 4 stat ratios into one ratio per vertex of the given geometry. */
function ratiosForShape(shape: GraphShape, ratios: number[]): number[] {
  if (shape === 'hexagon') {
    // Two derived axes: Consistency (academics+vitality) and Focus (culture+memories)
    return [
      ratios[0],
      (ratios[0] + ratios[1]) / 2,
      ratios[1],
      ratios[2],
      (ratios[2] + ratios[3]) / 2,
      ratios[3],
    ];
  }
  if (shape === 'star') {
    // Alternating spikes and notches.
    return STAR_ANGLES.map((_, i) => (i % 2 === 0 ? ratios[i % 4] : ratios[i % 4] * 0.55));
  }
  return [ratios[0], ratios[1], ratios[2], ratios[3]];
}

/**
 * Eases displayed values toward their targets so the radar visibly grows
 * as XP lands, instead of snapping between frames.
 */
function useTweenedValues(target: number[], duration = 700): number[] {
  const [values, setValues] = useState<number[]>(target);
  const fromRef = useRef<number[]>(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const key = target.join('|');

  useEffect(() => {
    const to = key.split('|').map(Number);
    fromRef.current = values;
    startRef.current = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValues(to.map((end, i) => fromRef.current[i] + (end - fromRef.current[i]) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // `values` is intentionally excluded: it changes every frame, which would restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration]);

  return values;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({
  stats,
  size = 280,
  history,
  onQuickLog,
  onSelectStat,
}) => {
  const [activeShape, setActiveShape] = useState<GraphShape>('auto');
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [pulse, setPulse] = useState<{ key: StatKey; rank: number } | null>(null);
  const [fade, setFade] = useState<{ from: GraphShape; id: number } | null>(null);

  const statList: StatInfo[] = STAT_ORDER.map((k) => stats[k]).filter(Boolean);

  const center = size / 2;
  const maxRadius = size * 0.38;

  const overallRank = statList.length
    ? Math.max(1, Math.round(statList.reduce((sum, s) => sum + s.rank, 0) / statList.length))
    : 1;

  // AUTO ladders the geometry with the overall rank; manual picks pin the shape.
  const shape: GraphShape = activeShape === 'auto' ? shapeForRank(overallRank) : activeShape;
  const angles = anglesFor(shape);
  const isRadial = shape !== 'bars';

  // --- Animated growth -----------------------------------------------------
  const targetRatios = statList.map(ratioFromStat);
  const liveRatios = useTweenedValues(targetRatios);
  const ratios = statList.length ? liveRatios : [0, 0, 0, 0];

  // --- Cross-fade between geometries --------------------------------------
  const prevShapeRef = useRef<GraphShape>(shape);
  useEffect(() => {
    if (prevShapeRef.current === shape) return;
    const from = prevShapeRef.current;
    prevShapeRef.current = shape;
    setFade({ from, id: Date.now() });
    const timer = setTimeout(() => setFade(null), 380);
    return () => clearTimeout(timer);
  }, [shape]);

  // --- Rank-up pulse -------------------------------------------------------
  const prevRanksRef = useRef<Partial<Record<StatKey, number>>>({});
  const rankSignature = statList.map((s) => `${s.key}:${s.rank}`).join('|');
  useEffect(() => {
    const prev = prevRanksRef.current;
    const next: Partial<Record<StatKey, number>> = {};
    let gained: StatKey | null = null;

    for (const stat of statList) {
      const previousRank = prev[stat.key];
      next[stat.key] = stat.rank;
      // prev is empty on first mount, so a fresh load never fires a pulse.
      if (previousRank !== undefined && stat.rank > previousRank) {
        gained = stat.key;
      }
    }
    prevRanksRef.current = next;

    if (!gained) return;
    const stat = statList.find((s) => s.key === gained);
    setPulse({ key: gained, rank: stat?.rank ?? 1 });
    playSelectSound();
    const timer = setTimeout(() => setPulse(null), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankSignature]);

  // --- Geometry helpers ----------------------------------------------------
  const getCoordinates = (angle: number, ratio: number) => {
    const r = ratio * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const toPoints = (shapeName: GraphShape, shapeRatios: number[]) => {
    const shapeAngles = anglesFor(shapeName);
    return shapeRatios
      .map((ratio, i) => {
        const c = getCoordinates(shapeAngles[i], ratio);
        return `${c.x.toFixed(2)},${c.y.toFixed(2)}`;
      })
      .join(' ');
  };

  const vertexRatios = ratiosForShape(shape, ratios);
  const polygonPoints = toPoints(shape, vertexRatios);

  const nodePoints = isRadial
    ? NODE_INDICES[shape].map((vertexIndex, i) => {
        const stat = statList[i];
        if (!stat) return null;
        const c = getCoordinates(angles[vertexIndex], vertexRatios[vertexIndex]);
        return { stat, x: c.x, y: c.y };
      })
    : [];

  // --- XP history trail ----------------------------------------------------
  // Walk backwards through each stat's snapshots, oldest-last, so the newest
  // trail sits closest to the live polygon.
  const historyLayers: number[][] = [];
  if (isRadial && history) {
    const depth = 4;
    for (let back = 1; back <= depth; back++) {
      const layer: number[] = [];
      let hasPoint = false;
      for (const key of STAT_ORDER) {
        const samples = history[key];
        if (!samples?.length) {
          layer.push(ratioFromXp(0));
          continue;
        }
        // Skip the sample that is the current value — the live polygon owns it.
        const idx = samples.length - 1 - back;
        if (idx < 0) {
          layer.push(ratioFromXp(samples[0]));
          continue;
        }
        layer.push(ratioFromXp(samples[idx]));
        hasPoint = true;
      }
      if (hasPoint) historyLayers.push(layer);
    }
  }

  const activeStatObj = statList.find((s) => s.key === hoveredStat);
  const morphing = fade !== null;

  const ringLabelAngle = -Math.PI / 4;
  const axisLabels = [
    { x: center, y: 16, anchor: 'middle' as const, stat: statList[0] },
    { x: size - 4, y: center + 4, anchor: 'end' as const, stat: statList[1] },
    { x: center, y: size - 4, anchor: 'middle' as const, stat: statList[2] },
    { x: 4, y: center + 4, anchor: 'start' as const, stat: statList[3] },
  ];

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Shape Selector Bar */}
      <div className="w-full flex items-center justify-between gap-1 mb-3 pb-2 border-b-2 border-white/20">
        <span className="text-[11px] font-p3r tracking-wider text-white">
          RADAR GEOMETRY:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['auto', ...MANEUVER_SHAPES] as const).map((shapeId) => (
            <button
              key={shapeId}
              onClick={() => {
                playSelectSound();
                setActiveShape(shapeId);
              }}
              onMouseEnter={playHoverSound}
              title={
                shapeId === 'auto'
                  ? `Auto: geometry follows overall rank (currently ${ROMAN_RANKS[overallRank - 1]})`
                  : shapeId
              }
              className={`px-2 py-1 text-[10px] font-p3r uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeShape === shapeId
                  ? 'bg-white text-[#0047D4] font-black shadow-[2px_2px_0px_#001F5C]'
                  : 'bg-[#0038A8] text-white hover:bg-[#0055FF] border border-white/30'
              }`}
            >
              {shapeId === 'auto' ? 'AUTO' : shapeId}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-mode banner: shows which geometry the current rank maps to */}
      {activeShape === 'auto' && (
        <div className="w-full mb-2 px-2 py-1 bg-[#001B4E] border border-[#FF0055] flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#FF0055] stroke-[3]" />
          <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">
            AUTO // RANK {ROMAN_RANKS[overallRank - 1]} → {shape.toUpperCase()}
          </span>
        </div>
      )}

      {/* Main Graph Area */}
      {shape === 'bars' ? (
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

            {/* Rank band grid — one ring per rank */}
            {RING_STEPS.map((step, idx) => {
              if (shape === 'circular') {
                return (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={maxRadius * step}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={idx === RING_STEPS.length - 1 ? 2 : 1}
                    strokeOpacity={idx === RING_STEPS.length - 1 ? 0.7 : 0.25}
                    strokeDasharray={idx < RING_STEPS.length - 1 ? '3 3' : 'none'}
                  />
                );
              }
              const ringPts = angles
                .map((ang) => {
                  const r = maxRadius * step;
                  return `${center + r * Math.cos(ang)},${center + r * Math.sin(ang)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={idx}
                  points={ringPts}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={idx === RING_STEPS.length - 1 ? 2 : 1}
                  strokeOpacity={idx === RING_STEPS.length - 1 ? 0.7 : 0.25}
                  strokeDasharray={idx < RING_STEPS.length - 1 ? '3 3' : 'none'}
                />
              );
            })}

            {/* Radial Axis Lines */}
            {angles.map((ang, idx) => (
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

            {/* Rank band labels (I..V) along the upper-right diagonal */}
            {RING_STEPS.map((step, idx) => {
              const c = getCoordinates(ringLabelAngle, step);
              return (
                <text
                  key={idx}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-p3r text-[9px] font-black"
                  fill="#FFFFFF"
                  fillOpacity={0.65}
                  stroke="#002673"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {ROMAN_RANKS[idx]}
                </text>
              );
            })}

            {/* XP history trail — fading silhouettes of previous snapshots */}
            {historyLayers.map((layer, li) => {
              const opacity = 0.05 + (li / Math.max(1, historyLayers.length)) * 0.3;
              return (
                <polygon
                  key={`ghost-${li}`}
                  points={toPoints(shape, ratiosForShape(shape, layer))}
                  fill="none"
                  stroke="#7DD3FC"
                  strokeWidth={1}
                  strokeOpacity={opacity}
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Ghost markers on each axis for the most recent history sample */}
            {historyLayers.length > 0 &&
              NODE_INDICES[shape].map((vertexIndex, i) => {
                const stat = statList[i];
                if (!stat) return null;
                const layer = historyLayers[historyLayers.length - 1];
                const c = getCoordinates(angles[vertexIndex], layer[vertexIndex]);
                return (
                  <circle
                    key={`ghost-node-${stat.key}`}
                    cx={c.x}
                    cy={c.y}
                    r={2.5}
                    fill="#7DD3FC"
                    fillOpacity={0.45}
                  />
                );
              })}

            {/* Outgoing polygon while the geometry morphs */}
            {morphing && fade && (
              <polygon
                key={`fade-${fade.id}`}
                points={toPoints(
                  fade.from,
                  ratiosForShape(fade.from, ratios)
                )}
                fill="url(#p3rRadarFill)"
                fillOpacity={0.35}
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeOpacity={0.5}
                className="animate-morph-out"
              />
            )}

            {/* Filled Polygon */}
            <polygon
              points={polygonPoints}
              fill="url(#p3rRadarFill)"
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinejoin="round"
              className={pulse ? 'animate-rankup-glow' : ''}
            />

            {/* Rank band ring flash for the stat that just ranked up */}
            {pulse &&
              (() => {
                const rankIdx = Math.min(Math.max(pulse.rank, 1), RING_STEPS.length) - 1;
                return (
                  <polygon
                    key={`band-${pulse.key}-${pulse.rank}`}
                    points={angles
                      .map((ang) => {
                        const r = maxRadius * RING_STEPS[rankIdx];
                        return `${center + r * Math.cos(ang)},${center + r * Math.sin(ang)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#FF0055"
                    strokeWidth={4}
                    className="animate-band-flash"
                  />
                );
              })()}

            {/* Interactive Nodes */}
            {nodePoints.map(
              (node) =>
                node && (
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
                    {/* Rank-up shockwave */}
                    {pulse?.key === node.stat.key && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={10}
                        fill="none"
                        stroke="#FF0055"
                        strokeWidth={3}
                        className="animate-node-burst"
                      />
                    )}
                    {/* Outer pulse target */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={hoveredStat === node.stat.key ? 12 : 7}
                      fill={hoveredStat === node.stat.key ? '#FF0055' : '#FFFFFF'}
                      stroke="#001F5C"
                      strokeWidth={2.5}
                      className="transition-all duration-150"
                    />
                    {/* Inner center dot */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={hoveredStat === node.stat.key ? 4 : 2.5}
                      fill={hoveredStat === node.stat.key ? '#FFFFFF' : '#0047D4'}
                    />
                  </g>
                )
            )}

            {/* Axis Labels with live rank */}
            {axisLabels.map(
              (label, i) =>
                label.stat && (
                  <text
                    key={label.stat.key}
                    x={label.x}
                    y={label.y}
                    textAnchor={label.anchor}
                    fill="#FFFFFF"
                    className="font-p3r text-[11px] font-black"
                  >
                    {label.stat.name.toUpperCase()}
                    <tspan
                      dx="4"
                      fill="#FF0055"
                      stroke="#002673"
                      strokeWidth={2}
                      paintOrder="stroke"
                    >
                      {label.stat.rankName}
                    </tspan>
                  </text>
                )
            )}
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
