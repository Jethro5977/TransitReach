import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

export interface LiveTransitVehicle {
  id: string;

  routeId: string | null;
  tripId: string | null;

  lat: number;
  lon: number;

  bearing: number | null;
  speedMps: number | null;

  timestamp: number | null;

  distanceToAccessibleStopMeters: number | null;
}

interface AccessibleStopLike {
  stop: {
    lat: number;
    lon: number;
  };
}

const LIVE_TRANSIT_URL =
  '/gtfs-rt/rapid-bus-kl';

/**
 * We only show vehicles reasonably close to a station
 * that the user can reach on foot.
 *
 * This prevents Epic 3 from turning into a general
 * Kuala Lumpur vehicle tracker.
 */
export const LIVE_TRANSIT_RADIUS_METERS = 1500;

function numericValue(
  value: unknown,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toString' in value
  ) {
    const parsed = Number(
      String(value),
    );

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const earthRadius = 6_371_000;

  const toRadians = (
    degrees: number,
  ) => degrees * Math.PI / 180;

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const deltaLat =
    toRadians(b.lat - a.lat);

  const deltaLon =
    toRadians(b.lon - a.lon);

  const sinLat =
    Math.sin(deltaLat / 2);

  const sinLon =
    Math.sin(deltaLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLon *
      sinLon;

  return (
    2 *
    earthRadius *
    Math.asin(Math.sqrt(h))
  );
}

/**
 * Downloads the official Rapid KL GTFS-Realtime
 * VehiclePosition feed and converts protobuf entities
 * into simple frontend objects.
 */
export async function fetchLiveTransitVehicles(
  signal?: AbortSignal,
): Promise<LiveTransitVehicle[]> {
  const response = await fetch(
    LIVE_TRANSIT_URL,
    {
      signal,
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Live transit feed returned ${response.status}`,
    );
  }

  const binary =
    new Uint8Array(
      await response.arrayBuffer(),
    );

  const feed =
    GtfsRealtimeBindings
      .transit_realtime
      .FeedMessage
      .decode(binary);

  const results:
    LiveTransitVehicle[] = [];

  for (
    const entity of feed.entity
  ) {
    const vehicle =
      entity.vehicle;

    const position =
      vehicle?.position;

    if (!vehicle || !position) {
      continue;
    }

    const lat =
      numericValue(
        position.latitude,
      );

    const lon =
      numericValue(
        position.longitude,
      );

    if (
      lat === null ||
      lon === null
    ) {
      continue;
    }

    const vehicleId =
      vehicle.vehicle?.id ??
      entity.id ??
      `${lat}-${lon}`;

    results.push({
      id: vehicleId,

      routeId:
        vehicle.trip?.routeId ??
        null,

      tripId:
        vehicle.trip?.tripId ??
        null,

      lat,
      lon,

      bearing:
        numericValue(
          position.bearing,
        ),

      speedMps:
        numericValue(
          position.speed,
        ),

      timestamp:
        numericValue(
          vehicle.timestamp,
        ),

      distanceToAccessibleStopMeters:
        null,
    });
  }

  return results;
}

/**
 * AC 3.2:
 * Only vehicles near stations that are currently
 * accessible through Epic 3 are retained.
 */
export function vehiclesNearAccessibleStops(
  vehicles: LiveTransitVehicle[],
  accessibleStops:
    AccessibleStopLike[],
  radiusMeters =
    LIVE_TRANSIT_RADIUS_METERS,
): LiveTransitVehicle[] {
  if (
    accessibleStops.length === 0
  ) {
    return [];
  }

  return vehicles.flatMap(
    vehicle => {
      let nearest =
        Number.POSITIVE_INFINITY;

      for (
        const result of
        accessibleStops
      ) {
        const distance =
          haversineMeters(
            {
              lat: vehicle.lat,
              lon: vehicle.lon,
            },
            {
              lat:
                result.stop.lat,
              lon:
                result.stop.lon,
            },
          );

        if (
          distance < nearest
        ) {
          nearest = distance;
        }
      }

      if (
        nearest >
        radiusMeters
      ) {
        return [];
      }

      return [
        {
          ...vehicle,
          distanceToAccessibleStopMeters:
            nearest,
        },
      ];
    },
  );
}