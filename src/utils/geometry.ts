export type { MapPoint } from '@/data/mockData';
import type { MapPoint } from '@/data/mockData';

export function dist(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: MapPoint, b: MapPoint, t: number): MapPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function midpoint(a: MapPoint, b: MapPoint): MapPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Catmull-Rom spline through points for smooth polygon boundaries
export function catmullRom(points: MapPoint[], segments = 12, closed = true): MapPoint[] {
  if (points.length < 3) return points;
  const result: MapPoint[] = [];
  const n = points.length;
  const pts = closed ? [points[n - 1], ...points, points[0], points[1]] : points;

  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const p2 = pts[i + 2];
    const p3 = pts[i + 3];

    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      result.push({ x, y });
    }
  }
  if (!closed) result.push(points[points.length - 1]);
  return result;
}

// Generate organic reachability polygon around a center point.
// Uses a seeded noise approach to create natural-looking irregular boundaries.
export function generateReachPolygon(
  center: MapPoint,
  timeBudget: number,
  seed: number,
  options?: { morning?: boolean; irregularity?: number },
): MapPoint[] {
  const morning = options?.morning ?? true;
  const irregularity = options?.irregularity ?? 0.25;

  // Base radius scales with time budget (map units)
  const baseRadius = 60 + timeBudget * 1.8;

  // Morning vs evening: evening has slightly less reach (traffic congestion)
  const timeFactor = morning ? 1.0 : 0.82;

  // Number of angular samples
  const samples = 36;

  // Seeded pseudo-random
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const points: MapPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    // Multi-octave noise for organic shape
    const n1 = Math.sin(angle * 3 + seed * 0.1) * 0.5;
    const n2 = Math.sin(angle * 7 + seed * 0.3) * 0.3;
    const n3 = rand() * irregularity;
    const noise = (n1 + n2 + n3 - 0.5) * irregularity;

    // Directional bias: extend more along transit corridors (horizontal/vertical)
    const transitBias = 1 + Math.abs(Math.cos(angle)) * 0.15 + Math.abs(Math.sin(angle * 2)) * 0.08;

    const r = baseRadius * timeFactor * (1 + noise) * transitBias;
    const x = center.x + Math.cos(angle) * r;
    const y = center.y + Math.sin(angle) * r;
    points.push({ x, y });
  }

  return catmullRom(points, 10, true);
}

// Polygon area (shoelace) in square map units, converted to km²
export function polygonArea(points: MapPoint[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

// Convert map units to km² (arbitrary scale for display)
export function mapAreaToKm2(mapArea: number): number {
  return mapArea * 0.0004;
}

// Point in polygon test
export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Smooth path through points (for transit lines)
export function smoothPath(points: MapPoint[], segments = 8): MapPoint[] {
  if (points.length < 3) return points;
  return catmullRom(points, segments, false);
}

// Convert MapPoint array to SVG path string
export function pointsToPath(points: MapPoint[], close = false): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  if (close) d += ' Z';
  return d;
}

// Convert MapPoint array to smooth SVG path (using quadratic curves through midpoints)
export function pointsToSmoothPath(points: MapPoint[], close = false): string {
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const mid = midpoint(points[i], points[i + 1]);
    d += ` Q ${points[i].x} ${points[i].y} ${mid.x} ${mid.y}`;
  }
  if (close) {
    const mid = midpoint(points[points.length - 1], points[0]);
    d += ` Q ${points[points.length - 1].x} ${points[points.length - 1].y} ${mid.x} ${mid.y}`;
    d += ` Q ${points[0].x} ${points[0].y} ${points[0].x} ${points[0].y}`;
    d += ' Z';
  } else {
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }
  return d;
}

// Interpolate between two polygons (for morphing)
export function interpolatePolygons(p1: MapPoint[], p2: MapPoint[], t: number): MapPoint[] {
  const n = Math.max(p1.length, p2.length);
  const result: MapPoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = p1[Math.floor((i / n) * p1.length)] ?? p1[p1.length - 1];
    const b = p2[Math.floor((i / n) * p2.length)] ?? p2[p2.length - 1];
    result.push(lerpPoint(a, b, t));
  }
  return result;
}

// Compute difference polygon regions (simplified: returns points of p2 not in p1)
export function polygonDifference(p1: MapPoint[], p2: MapPoint[]): MapPoint[] {
  return p2.filter(pt => !pointInPolygon(pt, p1));
}
