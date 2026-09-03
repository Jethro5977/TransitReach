import {
  useMemo,
} from 'react';

import L from 'leaflet';

import {
  Marker,
  Popup,
} from 'react-leaflet';

import type {
  LiveTransitVehicle,
} from '../liveTransitService';

interface Props {
  vehicles:
    LiveTransitVehicle[];
}

const busIcon =
  L.divIcon({
    className:
      'live-transit-marker',

    html: `
      <div class="live-transit-marker-inner">
        🚌
      </div>
    `,

    iconSize: [32, 32],

    iconAnchor: [16, 16],

    popupAnchor: [0, -16],
  });

function formatTimestamp(
  timestamp: number | null,
): string {
  if (!timestamp) {
    return 'Unknown';
  }

  return new Date(
    timestamp * 1000,
  ).toLocaleTimeString(
    'en-MY',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  );
}

export function LiveTransitMapLayer({
  vehicles,
}: Props) {
  const icon =
    useMemo(
      () => busIcon,
      [],
    );

  return (
    <>
      {vehicles.map(
        vehicle => (
          <Marker
            key={vehicle.id}
            position={[
              vehicle.lat,
              vehicle.lon,
            ]}
            icon={icon}
            zIndexOffset={500}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-bold text-slate-800">
                  Rapid KL Bus
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Live GTFS-Realtime
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <div>
                    <strong>
                      Route:
                    </strong>{' '}
                    {vehicle.routeId ??
                      'Unknown'}
                  </div>

                  <div>
                    <strong>
                      Vehicle:
                    </strong>{' '}
                    {vehicle.id}
                  </div>

                  {vehicle
                    .distanceToAccessibleStopMeters !==
                    null && (
                    <div>
                      <strong>
                        Near accessible station:
                      </strong>{' '}
                      {Math.round(
                        vehicle
                          .distanceToAccessibleStopMeters,
                      )}{' '}
                      m
                    </div>
                  )}

                  <div>
                    <strong>
                      Vehicle update:
                    </strong>{' '}
                    {formatTimestamp(
                      vehicle.timestamp,
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-3">
                  Source: Prasarana
                  via data.gov.my
                </div>
              </div>
            </Popup>
          </Marker>
        ),
      )}
    </>
  );
}