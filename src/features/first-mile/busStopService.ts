import rawBusStops
  from '@/shared/data/bus/stops.json';

export interface BusStop {
  stopId: string;
  name: string;
  lat: number;
  lon: number;

  distanceToAccessibleStationMeters:
    number | null;
}

interface AccessibleStopLike {
  stop: {
    lat: number;
    lon: number;
  };
}

const BUS_STOPS =
  rawBusStops as BusStop[];

export const BUS_STOP_RADIUS_METERS =
  1500;

function haversineMeters(
  a: {
    lat: number;
    lon: number;
  },
  b: {
    lat: number;
    lon: number;
  },
): number {
  const earthRadius =
    6_371_000;

  const toRadians = (
    value: number,
  ) =>
    value *
    Math.PI /
    180;

  const lat1 =
    toRadians(a.lat);

  const lat2 =
    toRadians(b.lat);

  const deltaLat =
    toRadians(
      b.lat - a.lat,
    );

  const deltaLon =
    toRadians(
      b.lon - a.lon,
    );

  const sinLat =
    Math.sin(
      deltaLat / 2,
    );

  const sinLon =
    Math.sin(
      deltaLon / 2,
    );

  const h =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLon *
      sinLon;

  return (
    2 *
    earthRadius *
    Math.asin(
      Math.sqrt(h),
    )
  );
}

export function busStopsNearAccessibleStations(
  accessibleStops:
    AccessibleStopLike[],
  radiusMeters =
    BUS_STOP_RADIUS_METERS,
): BusStop[] {
  if (
    accessibleStops.length === 0
  ) {
    return [];
  }

  return BUS_STOPS.flatMap(
    busStop => {
      let nearest =
        Number.POSITIVE_INFINITY;

      for (
        const result of
        accessibleStops
      ) {
        const distance =
          haversineMeters(
            {
              lat: busStop.lat,
              lon: busStop.lon,
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
          nearest =
            distance;
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
          ...busStop,

          distanceToAccessibleStationMeters:
            nearest,
        },
      ];
    },
  );
}