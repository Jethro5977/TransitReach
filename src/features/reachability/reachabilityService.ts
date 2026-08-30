import { TRANSIT_LINES } from '@/shared/data';
import { generateReachPolygon, mapAreaToKm2 } from '@/shared/data/mock/reachability';
import { loadRailFeedMetadata } from '@/shared/data/adapters/gtfsAdapter';
import { polygonArea } from '@/shared/lib/spatial';
import type { MapPoint } from '@/shared/types/location';
import type { LatLng, RailStop } from './types';

/** AC 1.1.1 — the search field stays inert below this length. */
export const MIN_QUERY_LENGTH = 2;

/** AC 1.1.1 — at most this many results are shown at once. */
export const MAX_RESULTS = 10;

/**
 * Matches stops for the search field.
 *
 * Case-insensitive substring on the stop name only — no fuzzy matching, no phonetic
 * matching, and deliberately not on any other field. Results are ordered by match
 * position (earliest first), then alphabetically, and capped at MAX_RESULTS.
 */
export function searchStops(query: string, stops: RailStop[]): RailStop[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return [];

  return stops
    .map(stop => ({ stop, at: stop.name.toLowerCase().indexOf(needle) }))
    .filter(({ at }) => at >= 0)
    .sort((a, b) => a.at - b.at || a.stop.name.localeCompare(b.stop.name))
    .slice(0, MAX_RESULTS)
    .map(({ stop }) => stop);
}

/**
 * How far beyond the loaded rail network still counts as inside the study area.
 *
 * AC 1.1.2 leaves the study-area bounding box undefined, blocked on the mode-scope
 * decision and the bus feed extent. Rather than invent coordinates, the box is derived
 * from the extent of the stops actually loaded plus this buffer, and that basis is
 * stated in the interface. Revisit once the bus and feeder feeds are inspected.
 */
export const STUDY_AREA_BUFFER_KM = 15;

const KM_PER_DEGREE_LAT = 110.574;
/** At ~3.1°N, near enough for a study-area buffer. */
const KM_PER_DEGREE_LON = 111.32 * Math.cos((3.1 * Math.PI) / 180);

const FEED_EXTENT = loadRailFeedMetadata().studyAreaFeedExtent;

export const STUDY_AREA = {
  minLat: FEED_EXTENT.minLat - STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LAT,
  maxLat: FEED_EXTENT.maxLat + STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LAT,
  minLon: FEED_EXTENT.minLon - STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LON,
  maxLon: FEED_EXTENT.maxLon + STUDY_AREA_BUFFER_KM / KM_PER_DEGREE_LON,
};

/** AC 1.1.2 — a click outside the covered area is rejected. */
export function isInStudyArea(p: LatLng): boolean {
  return (
    p.lat >= STUDY_AREA.minLat &&
    p.lat <= STUDY_AREA.maxLat &&
    p.lon >= STUDY_AREA.minLon &&
    p.lon <= STUDY_AREA.maxLon
  );
}

/** The centre of the loaded network, used as the map's default view. */
export const NETWORK_CENTRE: LatLng = {
  lat: (FEED_EXTENT.minLat + FEED_EXTENT.maxLat) / 2,
  lon: (FEED_EXTENT.minLon + FEED_EXTENT.maxLon) / 2,
};

/** AC 1.1.2 — coordinates are shown to 5 decimal places. */
export function formatCoord(p: LatLng): string {
  return `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
}

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
