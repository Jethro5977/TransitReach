import {
  CircleMarker,
  Polyline,
  Tooltip,
} from 'react-leaflet';

import type {
  FirstMileStopResult,
} from '../types';

interface FirstMileMapLayerProps {
  stops: FirstMileStopResult[];
  selectedStopId: string | null;
  onSelect: (stopId: string) => void;
}

export function FirstMileMapLayer({
  stops,
  selectedStopId,
  onSelect,
}: FirstMileMapLayerProps) {
  const selected =
    stops.find(
      item =>
        item.stop.stopId === selectedStopId,
    ) ?? null;

  return (
    <>
      {/* AC 3.1.4 — all candidate stations */}
      {stops.map(result => {
        const selectedMarker =
          result.stop.stopId ===
          selectedStopId;

        return (
          <CircleMarker
            key={result.stop.stopId}
            center={[
              result.stop.lat,
              result.stop.lon,
            ]}
            radius={
              selectedMarker ? 8 : 6
            }
            pathOptions={{
              color: selectedMarker
                ? '#0d9488'
                : '#475569',
              fillColor: '#ffffff',
              fillOpacity: 1,
              weight: selectedMarker
                ? 3
                : 2,
            }}
            eventHandlers={{
              click: () =>
                onSelect(
                  result.stop.stopId,
                ),
            }}
          >
            <Tooltip>
              <div>
                <strong>
                  {result.stop.name}
                </strong>
                <br />
                {Math.round(
                  result.route.distanceMeters,
                )}{' '}
                m ·{' '}
                {Math.ceil(
                  result.route.durationSeconds /
                    60,
                )}{' '}
                min walk
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* AC 3.1.2 + 3.1.4 — actual OSM walking geometry */}
      {selected &&
        selected.route.geometry.length >
          1 && (
          <Polyline
            positions={selected.route.geometry.map(
              point => [
                point.lat,
                point.lon,
              ],
            )}
            pathOptions={{
              color: '#0d9488',
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}
    </>
  );
}