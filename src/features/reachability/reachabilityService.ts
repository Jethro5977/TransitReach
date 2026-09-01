import { TRANSIT_LINES } from '@/shared/data';
import { generateReachPolygon, mapAreaToKm2 } from '@/shared/data/mock/reachability';
import { loadRailFeedMetadata } from '@/shared/data/adapters/gtfsAdapter';
import {
  WALK_SPEED_MS,
  DEPARTURE_TIME,
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

/**
 * AC 1.3.3 / AC 1.2.3 — modes absent from the computation, named rather than passed over
 * in silence. The wording is the epic's own.
 */
export const MODES_NOT_LOADED = 'Bus and feeder services are not included in this result.';

/**
 * AC 1.3.3 — the result is scheduled, not live. There is no realtime feed for rail in any
 * case: the Prasarana vehicle-position endpoint returns 404 for rapid-rail-kl, and the bus
 * feeds that do exist publish vehicle positions only, never trip updates, so they could not
 * shift a travel time even once loaded.
 */
export const REALTIME_NOTE =
  'Computed from scheduled service. It does not reflect current operating conditions, and ' +
  'no realtime data is incorporated — no realtime feed is published for rail.';

// ---------------------------------------------------------------- data basis

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** "20261231" -> "31 Dec 2026" */
function formatFeedDate(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${month} ${y}`;
}

export interface DataBasis {
  feedName: string;
  serviceStart: string;
  serviceEnd: string;
  licence: string | null;
  licenceStatus: string;
  /** Weekday or weekend — reachability differs between them, so it must be stated. */
  dayType: 'weekday' | 'weekend';
  dayLabel: string;
  /** Calendars in the feed that actually serve the departure day. */
  activeCalendars: string[];
  /** Expired calendars present in the feed and excluded from the computation. */
  expiredCalendars: { serviceId: string; endDate: string }[];
  modesNotLoaded: string;
  realtimeNote: string;
  lineCount: number;
}

/**
 * Describes what the displayed result was computed from.
 *
 * The day type is derived from the configured departure time rather than assumed, so it
 * cannot drift if that time changes. Expired calendars are reported from the feed itself:
 * they are present in calendar.txt but referenced by no trip, and the graph build bounds
 * the service period besides, so no result can be drawn from them.
 */
export function getDataBasis(): DataBasis {
  const meta = loadRailFeedMetadata();
  const feed = meta.feeds[0];

  const [datePart] = DEPARTURE_TIME.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const dayName = DAY_NAMES[dow];
  const dayType = dow === 0 || dow === 6 ? 'weekend' : 'weekday';

  return {
    feedName: feed.feedName,
    serviceStart: formatFeedDate(feed.serviceDateRange.start),
    serviceEnd: formatFeedDate(feed.serviceDateRange.end),
    licence: feed.licence,
    licenceStatus: feed.licenceStatus,
    dayType,
    dayLabel: DEPARTURE_TIME_LABEL,
    activeCalendars: feed.serviceCalendars
      .filter(c => c.referencedByTrips && !c.expired && c.days.includes(dayName))
      .map(c => c.serviceId),
    expiredCalendars: feed.serviceCalendars
      .filter(c => c.expired)
      .map(c => ({ serviceId: c.serviceId, endDate: formatFeedDate(c.endDate) })),
    modesNotLoaded: MODES_NOT_LOADED,
    realtimeNote: REALTIME_NOTE,
    lineCount: feed.lines.length,
  };
}

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
    status: `Routed along real streets and paths at ${WALK_SPEED_KMH} km/h, not measured in a straight line.`,
  },
  {
    label: 'Waiting for the first service',
    modelled: true,
    // AC 1.2.3 requires the rule for turning a headway into a wait to be stated plainly
    // rather than buried, so describe it in the words a rider would use.
    status:
      'However long it is until the next scheduled departure after you reach the stop. ' +
      'Services run every 3 minutes at peak and every 5 minutes off-peak.',
  },
  {
    label: 'In-vehicle time',
    modelled: true,
    status: 'Taken from the published timetable.',
  },
  {
    label: 'Interchange time between legs',
    estimate: true,
    modelled: false,
    status:
      'Not counted. The transit data publishes no interchange times, so a journey that ' +
      'involves changing lines may take longer than shown.',
  },
  {
    label: 'Walking from the last stop to your destination',
    modelled: true,
    status: `Routed along real streets and paths at ${WALK_SPEED_KMH} km/h, the same as the first walk.`,
  },
];

/**
 * Assumptions the result rests on that are not themselves components of the budget.
 * Stated rather than omitted — a reachable area means little without them.
 */
export const BUDGET_ASSUMPTIONS = [
  {
    label: 'Walking speed',
    status: `${WALK_SPEED_KMH} km/h`,
  },
  {
    label: 'Departure',
    status: DEPARTURE_TIME_IS_PROVISIONAL
      ? `${DEPARTURE_TIME_LABEL}. Reachability differs at other times of day.`
      : DEPARTURE_TIME_LABEL,
  },
  {
    label: 'Services included',
    status: `Rail only. ${MODES_NOT_LOADED}`,
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
