import type { RailStop } from '@/shared/data/adapters/gtfsAdapter';
import type { OsmPlace } from '@/shared/data/adapters/osmAdapter';

/**
 * A real-world position. Distinct from the prototype's MapPoint {x, y}, which is a
 * pixel coordinate on the abstract SVG canvas the other pages still use.
 */
export interface LatLng {
  lat: number;
  lon: number;
}

/** How the user set the starting point. */
export type OriginSource = 'stop' | 'place' | 'map' | 'device';

/**
 * The starting point of a reachability query. Exactly one exists at a time
 * (AC 1.1.2) — selecting another moves it rather than adding a second.
 */
export interface Origin {
  at: LatLng;
  source: OriginSource;
  /** Present only when source === 'stop'. */
  stop?: RailStop;
  /** Present only when source === 'place'. */
  place?: OsmPlace;
}

export type { RailStop, OsmPlace };
