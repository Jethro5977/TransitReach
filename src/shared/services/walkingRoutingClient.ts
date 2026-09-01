// Epic 3

import type {
  GeoPoint,
  WalkingRoute,
} from '@/features/first-mile/types';

const BASE_URL = (
  import.meta.env.VITE_OTP_BASE_URL ?? ''
).replace(/\/$/, '');

const ROUTING_DATE = '2026-09-01';
const ROUTING_TIME = '08:00:00';

interface OtpLeg {
  mode?: string;
  distance?: number;
  duration?: number;
  legGeometry?: {
    points?: string;
  };
}

interface OtpItinerary {
  duration?: number;
  walkDistance?: number;
  legs?: OtpLeg[];
}

interface OtpPlanResponse {
  plan?: {
    itineraries?: OtpItinerary[];
  };
  error?: {
    message?: string;
  };
}

export class WalkingRouteNotFoundError extends Error {
  constructor() {
    super('No pedestrian route was found.');
    this.name = 'WalkingRouteNotFoundError';
  }
}

export class WalkingRoutingUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'WalkingRoutingUnavailableError';
  }
}

/**
 * Decode Google's encoded polyline format used by OTP's legacy REST response.
 */
function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];

  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat =
      result & 1 ? ~(result >> 1) : result >> 1;

    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLon =
      result & 1 ? ~(result >> 1) : result >> 1;

    lon += deltaLon;

    points.push({
      lat: lat / 1e5,
      lon: lon / 1e5,
    });
  }

  return points;
}

function combineGeometry(legs: OtpLeg[]): GeoPoint[] {
  const result: GeoPoint[] = [];

  for (const leg of legs) {
    if (!leg.legGeometry?.points) continue;

    const decoded = decodePolyline(leg.legGeometry.points);

    for (const point of decoded) {
      const previous = result[result.length - 1];

      if (
        previous &&
        previous.lat === point.lat &&
        previous.lon === point.lon
      ) {
        continue;
      }

      result.push(point);
    }
  }

  return result;
}

/**
 * AC 3.1.2
 *
 * Routes a walking journey over the OSM pedestrian network loaded in our
 * self-hosted OpenTripPlanner instance.
 */
export async function routeWalking(
  from: GeoPoint,
  to: GeoPoint,
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  const params = new URLSearchParams({
    fromPlace: `${from.lat},${from.lon}`,
    toPlace: `${to.lat},${to.lon}`,
    mode: 'WALK',
    date: ROUTING_DATE,
    time: ROUTING_TIME,
    arriveBy: 'false',
    numItineraries: '1',
    locale: 'en',
  });

  let response: Response;

  try {
    response = await fetch(
      `${BASE_URL}/otp/routers/default/plan?${params.toString()}`,
      { signal },
    );
  } catch (error) {
    if (signal?.aborted) throw error;

    throw new WalkingRoutingUnavailableError(
      'Could not reach the walking routing service.',
      error,
    );
  }

  if (!response.ok) {
    throw new WalkingRoutingUnavailableError(
      `Walking routing service returned ${response.status}.`,
    );
  }

  const body = (await response.json()) as OtpPlanResponse;

  const itinerary = body.plan?.itineraries?.[0];

  if (!itinerary) {
    throw new WalkingRouteNotFoundError();
  }

  const walkingLegs =
    itinerary.legs?.filter(
      leg => !leg.mode || leg.mode.toUpperCase() === 'WALK',
    ) ?? [];

  const distanceMeters =
    itinerary.walkDistance ??
    walkingLegs.reduce(
      (total, leg) => total + (leg.distance ?? 0),
      0,
    );

  const durationSeconds =
    itinerary.duration ??
    walkingLegs.reduce(
      (total, leg) => total + (leg.duration ?? 0),
      0,
    );

  return {
    distanceMeters,
    durationSeconds,
    geometry: combineGeometry(walkingLegs),
  };
}