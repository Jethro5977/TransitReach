import { useMemo, useState, useCallback } from 'react';
import {
  CATEGORY_META,
  type ServiceLocation,
  type MapPoint,
} from '@/data/mockData';
import { pointInPolygon } from '@/utils/geometry';
import { usePrefersReducedMotion } from '@/hooks/useAnimations';

// ---- Reachability Polygon ----
interface ReachPolygonProps {
  points: MapPoint[];
  color?: string;
  fillOpacity?: number;
  animate?: boolean;
  band?: string;
  hovered?: boolean;
}

export function ReachPolygon({
  points,
  color = '#14b8a6',
  fillOpacity = 0.18,
  animate = true,
  band,
  hovered = false,
}: ReachPolygonProps) {
  const reduced = usePrefersReducedMotion();
  const pathData = useMemo(() => {
    if (points.length < 3) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';
    return d;
  }, [points]);

  if (!pathData) return null;

  return (
    <g
      style={{
        opacity: hovered ? 1 : 0.95,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <defs>
        <clipPath id={`reach-clip-${band ?? 'default'}`}>
          <path d={pathData} />
        </clipPath>
        <radialGradient id={`reach-grad-${band ?? 'default'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 1.5} />
          <stop offset="100%" stopColor={color} stopOpacity={fillOpacity * 0.6} />
        </radialGradient>
      </defs>
      <path
        d={pathData}
        fill={`url(#reach-grad-${band ?? 'default'})`}
        stroke={color}
        strokeWidth={hovered ? 2.5 : 1.5}
        strokeOpacity={hovered ? 0.8 : 0.5}
        style={{
          transformOrigin: 'center',
          animation: animate && !reduced ? 'fadeIn 500ms ease-out, scaleIn 700ms ease-out' : undefined,
        }}
      />
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </g>
  );
}

// ---- Difference Hatch (lost/gained areas) ----
interface HatchAreaProps {
  points: MapPoint[];
  type: 'lost' | 'gained';
  animate?: boolean;
}

export function HatchArea({ points, type, animate = true }: HatchAreaProps) {
  const reduced = usePrefersReducedMotion();
  const pathData = useMemo(() => {
    if (points.length < 3) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    d += ' Z';
    return d;
  }, [points]);

  if (!pathData) return null;

  const color = type === 'lost' ? '#f43f5e' : '#22c55e';
  const patternId = `hatch-${type}`;

  return (
    <g
      style={{
        animation: animate && !reduced ? 'fadeIn 600ms ease-out' : undefined,
      }}
    >
      <defs>
        <pattern id={patternId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="2" opacity="0.4" />
        </pattern>
      </defs>
      <path
        d={pathData}
        fill={`url(#${patternId})`}
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeDasharray="6 3"
      />
    </g>
  );
}

// ---- Service Pin ----
interface ServicePinProps {
  service: ServiceLocation;
  scale?: number;
  hovered?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  onHover?: (service: ServiceLocation | null) => void;
  animateIn?: boolean;
  index?: number;
}

export function ServicePin({
  service,
  scale = 1,
  hovered = false,
  selected = false,
  dimmed = false,
  onClick,
  onHover,
  animateIn = false,
  index = 0,
}: ServicePinProps) {
  const reduced = usePrefersReducedMotion();
  const meta = CATEGORY_META[service.category];
  const Icon = meta.icon;
  const [pressing, setPressing] = useState(false);

  const pinSize = 28 * scale * (hovered ? 1.08 : 1);
  const haloOpacity = hovered ? 0.25 : selected ? 0.2 : 0;

  return (
    <g
      transform={`translate(${service.pos.x}, ${service.pos.y})`}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.35 : 1,
        transition: 'opacity 250ms ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPressing(true);
        setTimeout(() => setPressing(false), 150);
        onClick?.();
      }}
      onMouseEnter={() => onHover?.(service)}
      onMouseLeave={() => onHover?.(null)}
    >
      {animateIn && !reduced && (
        <g style={{ animation: `pinEnter 400ms ease-out ${Math.min(index * 40, 400)}ms both` }}>
          {/* Halo */}
          {haloOpacity > 0 && (
            <circle
              r={pinSize * 0.9}
              fill={meta.color}
              opacity={haloOpacity}
              style={{ transition: 'r 200ms ease-out, opacity 200ms ease-out' }}
            />
          )}
          {/* Pin shadow */}
          <ellipse cx="0" cy="2" rx={pinSize * 0.35} ry={pinSize * 0.12} fill="rgba(11,36,59,0.15)" />
          {/* Pin body */}
          <g transform={`scale(${pressing ? 0.9 : 1})`} style={{ transition: 'transform 140ms ease-out' }}>
            <circle
              r={pinSize / 2}
              fill="white"
              stroke={meta.color}
              strokeWidth="2.5"
              style={{
                filter: selected ? `drop-shadow(0 2px 6px ${meta.color}40)` : 'drop-shadow(0 1px 3px rgba(11,36,59,0.15))',
                transition: 'r 200ms ease-out',
              }}
            />
            <foreignObject
              x={-pinSize / 2 + 4}
              y={-pinSize / 2 + 4}
              width={pinSize - 8}
              height={pinSize - 8}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon size={pinSize * 0.5} color={meta.color} strokeWidth={2.2} />
              </div>
            </foreignObject>
          </g>
        </g>
      )}
      {(!animateIn || reduced) && (
        <>
          {haloOpacity > 0 && (
            <circle
              r={pinSize * 0.9}
              fill={meta.color}
              opacity={haloOpacity}
              style={{ transition: 'r 200ms ease-out, opacity 200ms ease-out' }}
            />
          )}
          <ellipse cx="0" cy="2" rx={pinSize * 0.35} ry={pinSize * 0.12} fill="rgba(11,36,59,0.15)" />
          <g transform={`scale(${pressing ? 0.9 : 1})`} style={{ transition: 'transform 140ms ease-out' }}>
            <circle
              r={pinSize / 2}
              fill="white"
              stroke={meta.color}
              strokeWidth="2.5"
              style={{
                filter: selected ? `drop-shadow(0 2px 6px ${meta.color}40)` : 'drop-shadow(0 1px 3px rgba(11,36,59,0.15))',
              }}
            />
            <foreignObject
              x={-pinSize / 2 + 4}
              y={-pinSize / 2 + 4}
              width={pinSize - 8}
              height={pinSize - 8}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <Icon size={pinSize * 0.5} color={meta.color} strokeWidth={2.2} />
              </div>
            </foreignObject>
          </g>
        </>
      )}
    </g>
  );
}

// ---- Pin Cluster ----
interface PinClusterProps {
  pos: MapPoint;
  count: number;
  color?: string;
  onClick?: () => void;
}

export function PinCluster({ pos, count, color = '#0d9488', onClick }: PinClusterProps) {
  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <circle
        r="18"
        fill={color}
        opacity="0.15"
        style={{ transition: 'r 200ms ease-out' }}
      />
      <circle
        r="14"
        fill="white"
        stroke={color}
        strokeWidth="2"
        opacity="0.9"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill={color}
      >
        {count}
      </text>
    </g>
  );
}

// ---- Origin Marker ----
interface OriginMarkerProps {
  pos: MapPoint;
  animate?: boolean;
  showPulse?: boolean;
}

export function OriginMarker({ pos, animate = true, showPulse = false }: OriginMarkerProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {showPulse && !reduced && (
        <>
          <circle r="8" fill="#14b8a6" opacity="0.3" className="pulse-ring" />
          <circle r="8" fill="#14b8a6" opacity="0.2" className="pulse-ring" style={{ animationDelay: '300ms' }} />
        </>
      )}
      <g className={animate && !reduced ? 'marker-drop' : ''}>
        <circle r="10" fill="white" stroke="#0d9488" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 6px rgba(13,148,136,0.4))' }} />
        <circle r="4" fill="#0d9488" />
      </g>
    </g>
  );
}

// ---- Walking paths (nearby) ----
interface WalkingPathsProps {
  origin: MapPoint;
  stops: MapPoint[];
  animate?: boolean;
}

export function WalkingPaths({ origin, stops, animate = true }: WalkingPathsProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g>
      {stops.map((stop, i) => {
        const d = `M ${origin.x} ${origin.y} L ${stop.x} ${stop.y}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.4"
            strokeLinecap="round"
            className={animate && !reduced ? 'draw-route' : ''}
            style={{ animationDelay: `${i * 80}ms` }}
          />
        );
      })}
    </g>
  );
}

// ---- Scenario Route Overlay ----
interface ScenarioRouteOverlayProps {
  path: MapPoint[];
  color: string;
  stops: { name: string; pos: MapPoint }[];
  type: 'proposed' | 'suspended';
  animate?: boolean;
}

export function ScenarioRouteOverlay({ path, color, stops, type, animate = true }: ScenarioRouteOverlayProps) {
  const reduced = usePrefersReducedMotion();
  const d = useMemo(() => {
    let str = `M ${path[0].x} ${path[0].y}`;
    for (let i = 1; i < path.length; i++) {
      str += ` L ${path[i].x} ${path[i].y}`;
    }
    return str;
  }, [path]);

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={type === 'suspended' ? 3 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={type === 'suspended' ? '10 6' : undefined}
        opacity={type === 'suspended' ? 0.6 : 0.8}
        className={animate && !reduced ? 'draw-route' : ''}
        style={{ animationDuration: '1200ms' }}
      />
      {stops.map((stop, i) => (
        <g
          key={i}
          transform={`translate(${stop.pos.x}, ${stop.pos.y})`}
          className={animate && !reduced ? 'pin-enter' : ''}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {animate && !reduced && (
            <circle r="6" fill={color} opacity="0.3" className="expand-ring" style={{ animationDelay: `${i * 100}ms` }} />
          )}
          <circle r="5" fill="white" stroke={color} strokeWidth="2.5" />
          <circle r="2" fill={color} />
        </g>
      ))}
    </g>
  );
}

// ---- Area Cluster (for typology page) ----
interface AreaClusterProps {
  pos: MapPoint;
  radius: number;
  color: string;
  label: string;
  typology: string;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onHover?: (label: string | null) => void;
  animateIn?: boolean;
  index?: number;
}

export function AreaCluster({
  pos, radius, color, label, typology, selected = false, hovered = false,
  onClick, onHover, animateIn = false, index = 0,
}: AreaClusterProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      onClick={onClick}
      onMouseEnter={() => onHover?.(label)}
      onMouseLeave={() => onHover?.(null)}
      className={animateIn && !reduced ? 'fade-in' : ''}
      style={{ cursor: 'pointer', animationDelay: `${index * 80}ms` }}
    >
      <circle
        r={radius}
        fill={color}
        fillOpacity={selected ? 0.25 : hovered ? 0.18 : 0.1}
        stroke={color}
        strokeWidth={selected ? 2.5 : hovered ? 2 : 1.5}
        strokeOpacity={selected ? 0.8 : 0.5}
        strokeDasharray={typology === 'peri-urban' || typology === 'rural' ? '6 4' : undefined}
        style={{ transition: 'all 200ms ease-out' }}
      />
      <text
        y={radius + 14}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#0b243b"
        opacity={selected || hovered ? 1 : 0.7}
        style={{ transition: 'opacity 200ms ease-out' }}
      >
        {label}
      </text>
    </g>
  );
}

// Helper: filter services within polygon
export function servicesInPolygon(services: ServiceLocation[], polygon: MapPoint[]): ServiceLocation[] {
  return services.filter(s => pointInPolygon(s.pos, polygon));
}

// Helper: get nearby stops within radius
export function nearbyStops(origin: MapPoint, stops: MapPoint[], radius: number): MapPoint[] {
  return stops.filter(s => Math.hypot(s.x - origin.x, s.y - origin.y) <= radius);
}
