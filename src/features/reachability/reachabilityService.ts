import { TRANSIT_LINES } from '@/shared/data';
import { generateReachPolygon, mapAreaToKm2 } from '@/shared/data/mock/reachability';
import { polygonArea } from '@/shared/lib/spatial';
import type { MapPoint } from '@/shared/types/location';

export function calculatePrototypeReachability(origin: MapPoint, timeBudgetMinutes: number) {
  const polygon = generateReachPolygon(origin, timeBudgetMinutes, 42);
  return { polygon, areaKm2: mapAreaToKm2(polygonArea(polygon)) };
}

export function getHighlightedTransitLineIds(origin: MapPoint, enabled: boolean): string[] {
  if (!enabled) return [];
  return TRANSIT_LINES
    .filter(line => line.stops.some(stop => Math.hypot(stop.pos.x - origin.x, stop.pos.y - origin.y) < 100))
    .map(line => line.id);
}
