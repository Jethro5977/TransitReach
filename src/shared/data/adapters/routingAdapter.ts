/**
 * Client for the self-hosted OpenTripPlanner instance.
 *
 * Reachability is computed by routing over the real OSM street network and the rail
 * schedule. Nothing here substitutes straight-line distance for a walking component, and
 * the engine is ours rather than a third party's, so no user coordinate is handed to an
 * outside routing service.
 *
 * Setup, version pinning and the traps involved are documented in routing/README.md.
 */

import { loadRailFeedMetadata } from './gtfsAdapter';

/**
 * Where the routing service lives.
 *
 * In development, default to a locally running OTP. In a production build, default to
 * the app's **own origin**, so requests go to `/otp/...` and are forwarded by the
 * `/otp/*` proxy rule in `public/_redirects`.
 *
 * The production default deliberately is not localhost. A deployed build that falls back
 * to localhost asks every visitor's own machine for routing, which fails for all of them
 * while looking like the routing server is down — and the deployer gets no hint that a
 * missing environment variable is the cause. Defaulting to same-origin means deployment
 * needs only the redirect rule, which lives in the repo and travels with the code.
 *
 * `VITE_OTP_BASE_URL` still overrides both, for pointing dev at a hosted engine. Note
 * that Vite inlines it at build time, so it requires a rebuild, not just a restart.
 */
const DEFAULT_BASE_URL = import.meta.env.DEV ? 'http://localhost:8080' : '';
const BASE_URL = (import.meta.env.VITE_OTP_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

/**
 * Departure time used for every computation.
 *
 * PROVISIONAL and deliberately arbitrary — a weekday 08:00 inside the feed's service
 * window. Epics 1, 2, 5, 6 and 8 must eventually share one agreed value or their numbers
 * will not reconcile with each other. This is surfaced in the interface rather than left
 * buried here, because a reachable area means nothing without the hour it was computed for.
 */
export const DEPARTURE_TIME = '2026-09-01T08:00:00+08:00';
export const DEPARTURE_TIME_LABEL = 'Tuesday 08:00';
export const DEPARTURE_TIME_IS_PROVISIONAL = true;

/**
 * Walking speed OTP is configured with, in metres per second.
 * Mirrors `routingDefaults.walk.speed` in routing/otp/router-config.json.
 * AC 1.2.3 requires this to be stated in the interface; if you change one, change both.
 */
export const WALK_SPEED_MS = 1.33;

/**
 * Transit modes present in the loaded feed. Every rail route is SUBWAY; BRT Sunway is TRAM.
 */
const TRANSIT_MODES = 'WALK,SUBWAY,TRAM';

/**
 * Sentinel used to obtain a walking-only isochrone.
 *
 * OTP's TravelTime endpoint cannot be asked to exclude transit: passing `modes=WALK`
 * produces an *empty* transit-mode filter, which OTP treats as "no restriction" and so
 * includes every mode. The only way to get a walking-only result is to name a transit
 * mode the feed does not contain.
 *
 * FUNICULAR is chosen over the more obvious RAIL or BUS precisely because those become
 * real once the bus and feeder feeds are loaded, which would silently turn this into a
 * transit-inclusive query. Klang Valley has no funicular. `assertSentinelUnused()` fails
 * loudly if that ever stops being true.
 */
const WALK_ONLY_MODES = 'WALK,FUNICULAR';

export interface Ring {
  /** GeoJSON order: [lon, lat]. */
  coordinates: [number, number][];
}

export interface IsochroneRegion {
  outer: [number, number][];
  holes: [number, number][][];
}

export interface IsochroneResult {
  budgetMinutes: number;
  /** Disjoint regions. AC 1.3.1 forbids merging these into one enclosing shape. */
  regions: IsochroneRegion[];
  areaKm2: number;
}

export class RoutingUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'RoutingUnavailableError';
  }
}

export class RoutingTimeoutError extends Error {
  constructor(readonly limitMs: number) {
    super(`Reachability computation exceeded ${limitMs} ms.`);
    this.name = 'RoutingTimeoutError';
  }
}

/**
 * How long a computation may run before it is abandoned.
 *
 * AC 1.3.2 left this value blocked, pending a benchmark of a routing engine that had not
 * been stood up. It has been. Measured against the local instance over 36 runs — 9 origins
 * spread across the network × the four budgets, timing both isochrones in parallel exactly
 * as the app issues them:
 *
 *     p50 460 ms   p95 1075 ms   max 1089 ms
 *
 * 15 s is roughly 14× the observed maximum. The headroom is deliberate: those figures come
 * from a local instance with no network in the path, and the deployed engine will sit
 * behind real latency on a smaller machine than this one. Re-measure once it is hosted —
 * this number should come down, not stay at a figure chosen to be safe for an unknown.
 */
export const COMPUTATION_TIMEOUT_MS = 15_000;

/** Guards the walking-only sentinel against the feed growing a funicular. */
function assertSentinelUnused(): void {
  const modes = loadRailFeedMetadata()
    .feeds.flatMap(f => f.lines)
    .map(l => l.mode.toUpperCase());
  if (modes.includes('FUNICULAR')) {
    throw new Error(
      'The loaded feed contains a FUNICULAR route, which is used as the walking-only ' +
      'sentinel in routingAdapter. Pick a different absent mode and update WALK_ONLY_MODES.',
    );
  }
}

// ---------------------------------------------------------------- geometry

const EARTH_KM_PER_DEG_LAT = 110.574;
const kmPerDegLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/** Shoelace area of a ring in km², using a local equirectangular approximation. */
function ringAreaKm2(ring: [number, number][]): number {
  if (ring.length < 3) return 0;
  const lat0 = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const kx = kmPerDegLon(lat0);
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * kx * (y2 * EARTH_KM_PER_DEG_LAT) - x2 * kx * (y1 * EARTH_KM_PER_DEG_LAT);
  }
  return Math.abs(sum / 2);
}

/** Total area of the regions, with holes subtracted. */
function totalAreaKm2(regions: IsochroneRegion[]): number {
  return regions.reduce(
    (sum, r) => sum + ringAreaKm2(r.outer) - r.holes.reduce((h, ring) => h + ringAreaKm2(ring), 0),
    0,
  );
}

interface OtpGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

function toRegions(geometry: OtpGeometry): IsochroneRegion[] {
  const polygons = (
    geometry.type === 'MultiPolygon'
      ? (geometry.coordinates as number[][][][])
      : [geometry.coordinates as number[][][]]
  );
  return polygons
    .filter(rings => rings.length > 0)
    .map(rings => ({
      outer: rings[0] as [number, number][],
      holes: rings.slice(1) as [number, number][][],
    }));
}

// ---------------------------------------------------------------- requests

async function fetchIsochrone(
  origin: { lat: number; lon: number },
  budgetMinutes: number,
  modes: string,
  signal: AbortSignal,
): Promise<IsochroneRegion[]> {
  const url =
    `${BASE_URL}/otp/traveltime/isochrone?batch=true` +
    `&location=${origin.lat},${origin.lon}` +
    `&time=${encodeURIComponent(DEPARTURE_TIME)}` +
    `&modes=${modes}&arriveBy=false&cutoff=${budgetMinutes}M`;

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new RoutingUnavailableError('Could not reach the routing service.', error);
  }
  if (!response.ok) {
    throw new RoutingUnavailableError(`Routing service returned ${response.status}.`);
  }

  const body = (await response.json()) as { features?: { geometry: OtpGeometry }[] };
  const feature = body.features?.[0];
  if (!feature) return [];
  return toRegions(feature.geometry);
}

export interface ReachabilityComputation {
  result: IsochroneResult;
  /**
   * True when no transit could be boarded within the budget, so the area shown is
   * walking only. AC 1.2.4 treats this as a valid finding, never an error.
   */
  walkingOnly: boolean;
}

/**
 * Computes the reachable area, and determines whether any transit was boardable.
 *
 * Both isochrones are requested concurrently. The walking-only one is needed either way:
 * it is what gets displayed when nothing can be boarded, and comparing the two is how
 * that condition is detected — OTP does not report it.
 */
export async function computeReachability(
  origin: { lat: number; lon: number },
  budgetMinutes: number,
  signal: AbortSignal,
): Promise<ReachabilityComputation> {
  assertSentinelUnused();

  // The caller's signal (a superseded run) and the time limit both cancel the requests,
  // but they are different outcomes: one is discarded silently, the other is reported.
  // `timedOut` is what tells them apart once the fetch has already rejected as aborted.
  const inner = new AbortController();
  let timedOut = false;
  const abortInner = () => inner.abort();
  signal.addEventListener('abort', abortInner);
  const timer = setTimeout(() => {
    timedOut = true;
    inner.abort();
  }, COMPUTATION_TIMEOUT_MS);

  let full: IsochroneRegion[];
  let walkOnly: IsochroneRegion[];
  try {
    [full, walkOnly] = await Promise.all([
      fetchIsochrone(origin, budgetMinutes, TRANSIT_MODES, inner.signal),
      fetchIsochrone(origin, budgetMinutes, WALK_ONLY_MODES, inner.signal),
    ]);
  } catch (error) {
    if (timedOut) throw new RoutingTimeoutError(COMPUTATION_TIMEOUT_MS);
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abortInner);
  }

  const fullArea = totalAreaKm2(full);
  const walkArea = totalAreaKm2(walkOnly);

  // If no service can be boarded the two computations are the same search, so their
  // areas coincide. A small tolerance absorbs contouring noise.
  const walkingOnly = fullArea <= walkArea * 1.005;
  const regions = walkingOnly ? walkOnly : full;

  return {
    walkingOnly,
    result: {
      budgetMinutes,
      regions,
      areaKm2: walkingOnly ? walkArea : fullArea,
    },
  };
}
