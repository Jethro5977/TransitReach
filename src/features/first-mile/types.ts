import type {
  RailLine,
  RailStop,
} from '@/shared/data/adapters/gtfsAdapter';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface WalkingRoute {
  distanceMeters: number;
  durationSeconds: number;

  /**
   * Real pedestrian route returned by OTP.
   * This is NOT a straight line.
   */
  geometry: GeoPoint[];
}

export interface FirstMileStopResult {
  stop: RailStop;
  lines: RailLine[];
  route: WalkingRoute;
}

export type FirstMileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'ready';
      stops: FirstMileStopResult[];
      unroutableCandidateCount: number;
    }
  | {
      status: 'failed';
      message: string;
    };