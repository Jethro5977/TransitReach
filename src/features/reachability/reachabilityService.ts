import { TRANSIT_LINES } from '@/shared/data';
import { generateReachPolygon, mapAreaToKm2 } from '@/shared/data/mock/reachability';
import { loadRailFeedMetadata } from '@/shared/data/adapters/gtfsAdapter';
import {
  WALK_SPEED_MS,
  DEPARTURE_TIME_LABEL,
  DEPARTURE_TIME_IS_PROVISIONAL,
} from '@/shared/data/adapters/routingAdapter';
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

/**
 * AC 1.2.3 — the five components the travel time budget is spent on.
 *
 * Every component the budget covers is listed whether or not it is modelled yet. A
 * component that is not yet modelled says so; none is silently excluded, and no blocked
 * value is filled in with a plausible-looking number. `owner` names the epic or decision
 * that has to resolve the component before it can be modelled.
 */
/** The configured walking speed, in km/h, for display. */
export const WALK_SPEED_KMH = Math.round(WALK_SPEED_MS * 3.6 * 10) / 10;

export interface BudgetComponent {
  label: string;
  /** Marks a component whose value is inferred rather than published. */
  estimate?: boolean;
  modelled: boolean;
  /** What the component currently contributes, in plain words. */
  status: string;
  /** Who resolves it. Absent once the component is modelled. */
  owner?: string;
}

export const BUDGET_COMPONENTS: BudgetComponent[] = [
  {
    label: 'Walking to the first stop',
    modelled: true,
    status: `Routed over the OpenStreetMap pedestrian network at ${WALK_SPEED_KMH} km/h. No straight-line distance is used.`,
  },
  {
    label: 'Waiting for the first service',
    modelled: true,
    status:
      'Counted from the feed\'s published headways (3 min at peak, 5 min off-peak), ' +
      'expanded into scheduled departures. The wait is whatever the next departure ' +
      'after arrival at the stop implies, not a separate agreed rule.',
    owner: 'rule still to be confirmed',
  },
  {
    label: 'In-vehicle time',
    modelled: true,
    status: 'From the feed\'s scheduled stop times.',
  },
  {
    label: 'Interchange time between legs',
    estimate: true,
    modelled: false,
    status:
      'Not modelled — no interchange penalty is applied, so journeys with a transfer are ' +
      'optimistic. The transit data publishes no interchange times at all.',
    owner: 'Interchange Time Estimation',
  },
  {
    label: 'Walking from the last stop to the destination',
    modelled: true,
    status: `Routed over the pedestrian network at ${WALK_SPEED_KMH} km/h, same as the first-stop walk.`,
  },
];

/**
 * Assumptions the budget rests on that are not themselves components.
 * Named rather than omitted, for the same reason as the components above.
 */
export const BUDGET_ASSUMPTIONS = [
  {
    label: 'Walking speed',
    status: `${WALK_SPEED_KMH} km/h (${WALK_SPEED_MS} m/s)`,
  },
  {
    label: 'Departure time',
    status: DEPARTURE_TIME_IS_PROVISIONAL
      ? `${DEPARTURE_TIME_LABEL} — provisional, and every epic that computes reachability must share one agreed value`
      : DEPARTURE_TIME_LABEL,
    owner: DEPARTURE_TIME_IS_PROVISIONAL ? 'team decision' : undefined,
  },
  {
    label: 'Modes included',
    status: 'Rail only. Bus and feeder services are not included in this result.',
    owner: 'bus feeds not yet loaded',
  },
];

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
