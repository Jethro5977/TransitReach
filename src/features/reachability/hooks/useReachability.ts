import { useState } from 'react';
import type { LatLng, Origin, RailStop } from '../types';
import { isInStudyArea } from '../reachabilityService';

/** AC 1.1.2 — a click outside the covered area is rejected with this message. */
const OUTSIDE_AREA = 'Selected point is outside the covered area';

/** AC 1.1.4 — device location is optional; nothing is disabled when it is unavailable. */
const LOCATION_UNAVAILABLE = 'Location unavailable. Search for a stop or tap the map instead.';
const LOCATION_OUTSIDE_AREA = 'Your location is outside the covered area';

/** AC 1.2.1 — 30 min is selected before any starting point has been chosen. */
const DEFAULT_TIME_BUDGET = 30;

export function useReachability(
  initialStop: RailStop | null,
  onToast: (message: string, icon?: string) => void,
) {
  const [origin, setOrigin] = useState<Origin | null>(
    initialStop ? { at: { lat: initialStop.lat, lon: initialStop.lon }, source: 'stop', stop: initialStop } : null,
  );
  const [timeBudget, setTimeBudget] = useState(DEFAULT_TIME_BUDGET);

  /** Selecting a stop places the origin at its stop_lat / stop_lon from the feed. */
  const selectStop = (stop: RailStop) => {
    setOrigin({ at: { lat: stop.lat, lon: stop.lon }, source: 'stop', stop });
  };

  /**
   * AC 1.1.2 — sets the origin at an arbitrary in-area coordinate. A stop need not be
   * nearby. Out of area, the previous origin is retained rather than cleared.
   */
  const selectPoint = (at: LatLng) => {
    if (!isInStudyArea(at)) {
      onToast(OUTSIDE_AREA, '!');
      return;
    }
    setOrigin({ at, source: 'map' });
  };

  /**
   * AC 1.1.4 — the permission is requested here and nowhere else, so nothing prompts on
   * page load. The position sets the origin directly, with no confirmation step. It is
   * held in state only: never stored beyond the session, never sent anywhere.
   */
  const requestDeviceLocation = () => {
    if (!('geolocation' in navigator)) {
      onToast(LOCATION_UNAVAILABLE, '!');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const at = { lat: position.coords.latitude, lon: position.coords.longitude };
        if (!isInStudyArea(at)) {
          onToast(LOCATION_OUTSIDE_AREA, '!');
          return;
        }
        setOrigin({ at, source: 'device' });
      },
      () => onToast(LOCATION_UNAVAILABLE, '!'),
    );
  };

  /** AC 1.1.5 — clears the starting point and returns the map to its default view. */
  const clearOrigin = () => setOrigin(null);

  /** AC 1.1.5 / AC 1.2.2 — the budget survives a change of starting point, and vice versa. */
  const changeTimeBudget = (minutes: number) => setTimeBudget(minutes);

  return {
    origin,
    timeBudget,
    selectStop,
    selectPoint,
    requestDeviceLocation,
    clearOrigin,
    changeTimeBudget,
  };
}
