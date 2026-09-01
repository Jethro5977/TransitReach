import {
  AlertTriangle,
  Footprints,
  Loader2,
  Train,
} from 'lucide-react';

import type {
  FirstMileState,
} from '../types';

interface NearbyStopsPanelProps {
  state: FirstMileState;
  thresholdMinutes: number;
  onThresholdChange: (
    minutes: number,
  ) => void;
  selectedStopId: string | null;
  onSelectStop: (
    stopId: string,
  ) => void;
}

const THRESHOLDS = [5, 10, 15, 20];

function formatDistance(
  metres: number,
): string {
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }

  return `${(metres / 1000).toFixed(
    1,
  )} km`;
}

export function NearbyStopsPanel({
  state,
  thresholdMinutes,
  onThresholdChange,
  selectedStopId,
  onSelectStop,
}: NearbyStopsPanelProps) {
  if (state.status === 'idle') {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 sm:right-6 z-[500] w-[340px] max-w-[calc(100vw-2rem)]">
      <div className="glass p-4 max-h-[55vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 mb-3">
          <Footprints
            size={17}
            className="text-teal-600"
          />

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              First-mile walking access
            </h2>

            <p className="text-[11px] text-slate-500">
              Walking routes use the OSM
              pedestrian network.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Walking threshold
          </div>

          <div className="flex gap-1.5">
            {THRESHOLDS.map(minutes => (
              <button
                key={minutes}
                type="button"
                onClick={() =>
                  onThresholdChange(minutes)
                }
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  thresholdMinutes ===
                  minutes
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {state.status ===
          'loading' && (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-600">
            <Loader2
              size={16}
              className="spinner text-teal-600"
            />
            Routing walking access to nearby
            stations…
          </div>
        )}

        {state.status ===
          'failed' && (
          <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 rounded-xl p-3">
            <AlertTriangle
              size={16}
              className="shrink-0 mt-0.5"
            />
            {state.message}
          </div>
        )}

        {state.status ===
          'ready' &&
          state.stops.length === 0 && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
              No usable public transport stop
              was found within a{' '}
              {thresholdMinutes}-minute
              walking route.
            </div>
          )}

        {state.status ===
          'ready' &&
          state.stops.length > 0 && (
            <>
              <div className="text-xs text-slate-500 mb-2">
                {
                  state.stops.length
                }{' '}
                station
                {state.stops.length === 1
                  ? ''
                  : 's'}{' '}
                reachable within{' '}
                {thresholdMinutes} min.
                Select any station to view its
                walking route.
              </div>

              <div className="space-y-2">
                {state.stops.map(result => {
                  const selected =
                    selectedStopId ===
                    result.stop.stopId;

                  return (
                    <button
                      key={
                        result.stop.stopId
                      }
                      type="button"
                      onClick={() =>
                        onSelectStop(
                          result.stop.stopId,
                        )
                      }
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        selected
                          ? 'border-teal-400 bg-teal-50/80'
                          : 'border-slate-200 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-800">
                            {
                              result.stop
                                .name
                            }
                          </div>

                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                            <Train
                              size={11}
                            />
                            {result.lines
                              .map(
                                line =>
                                  line.longName,
                              )
                              .join(' · ')}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-slate-800">
                            {Math.ceil(
                              result.route
                                .durationSeconds /
                                60,
                            )}{' '}
                            min
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {formatDistance(
                              result.route
                                .distanceMeters,
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-500">
                        Service information
                        shown without ranking or
                        recommendation.
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
      </div>
    </div>
  );
}