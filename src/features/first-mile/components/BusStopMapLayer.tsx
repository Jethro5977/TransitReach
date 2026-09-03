import {
  CircleMarker,
  Popup,
} from 'react-leaflet';

import type { BusStop } from '../busStopService';

interface Props {
  stops: BusStop[];
}

export function BusStopMapLayer({
  stops,
}: Props) {
  return (
    <>
      {stops.map(
        stop => (
          <CircleMarker
            key={stop.stopId}

            center={[
              stop.lat,
              stop.lon,
            ]}

            radius={4}

            pathOptions={{
              color:
                '#2563eb',

              weight: 1.5,

              fillColor:
                '#ffffff',

              fillOpacity: 1,
            }}
          >
            <Popup>
              <div
                className="
                  min-w-[170px]
                "
              >
                <div
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-blue-500
                  "
                >
                  Rapid KL Bus Stop
                </div>

                <div
                  className="
                    mt-1
                    font-semibold
                    text-slate-800
                  "
                >
                  {stop.name}
                </div>

                <div
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  Stop ID:{' '}
                  {stop.stopId}
                </div>

                {stop
                  .distanceToAccessibleStationMeters !==
                  null && (
                  <div
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    {
                      Math.round(
                        stop
                          .distanceToAccessibleStationMeters,
                      )
                    }{' '}
                    m from an
                    accessible
                    station
                  </div>
                )}

                <div
                  className="
                    mt-2
                    text-[10px]
                    text-slate-400
                  "
                >
                  Source:
                  Prasarana
                  GTFS Static
                  via
                  data.gov.my
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ),
      )}
    </>
  );
}