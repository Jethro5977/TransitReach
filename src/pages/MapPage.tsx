import { useState } from 'react';
import { Crosshair, Maximize2, Minimize2, X } from 'lucide-react';
import { Tooltip } from '@/shared/ui';
import {
  BaseMap,
  LocationSearch,
  TimeBudgetSelector,
  useReachability,
  type RailStop,
} from '@/features/reachability';
import { formatCoord, STUDY_AREA_BUFFER_KM } from '@/features/reachability/reachabilityService';
import { linesForStop } from '@/shared/data/adapters/gtfsAdapter';

interface MapPageProps {
  initialLocation: RailStop | null;
  onToast: (message: string, icon?: string) => void;
}

export function MapPage({ initialLocation, onToast }: MapPageProps) {
  const [configOpen, setConfigOpen] = useState(true);
  const reach = useReachability(initialLocation, onToast);

  return (
    // top-16 rather than pt-16: an absolutely positioned child resolves inset-0 against
    // the padding box, so padding here would let the map slide under the navbar.
    <div className="fixed left-0 right-0 bottom-0 top-16 overflow-hidden">
      <div className="absolute inset-0">
        <BaseMap origin={reach.origin} onMapClick={reach.selectPoint} />
      </div>

      <div className={`absolute top-4 left-4 sm:left-6 z-[500] transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="glass p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            {configOpen && <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Starting Point</h2>}
            <Tooltip content={configOpen ? 'Collapse' : 'Expand'}>
              <button onClick={() => setConfigOpen(prev => !prev)} className="btn-icon ml-auto" style={{ width: 32, height: 32 }}>
                {configOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
          </div>

          {configOpen && (
            <div className="space-y-4 fade-in">
              <LocationSearch
                onSelect={reach.selectStop}
                selected={reach.origin?.stop ?? null}
                compact
              />

              <div className="flex items-center gap-2">
                {/* AC 1.1.4 — the permission is requested on this tap and nowhere else. */}
                <button
                  onClick={reach.requestDeviceLocation}
                  className="btn-secondary inline-flex items-center gap-2 text-xs py-2 px-3"
                >
                  <Crosshair size={14} />
                  Use my location
                </button>
                {reach.origin && (
                  <button
                    onClick={reach.clearOrigin}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>

              {reach.origin && <OriginReadout origin={reach.origin} />}

              {!reach.origin && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search by station or stop name, or tap the map to choose a starting point.
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Time Budget</label>
                <TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} />
              </div>
            </div>
          )}
        </div>
      </div>

      {configOpen && <CoveredAreaNote />}
    </div>
  );
}

/**
 * AC 1.1.2 — a map-selected point shows its coordinate to 5 decimal places. A stop shows
 * the exact feed name and the lines serving it. No walking distance, walking time or
 * nearest stop is produced here; those belong to the First-Mile Walking Access epic.
 */
function OriginReadout({ origin }: { origin: NonNullable<ReturnType<typeof useReachability>['origin']> }) {
  const label =
    origin.source === 'stop' ? 'Selected stop'
    : origin.source === 'device' ? 'Your location'
    : 'Selected point';

  return (
    <div className="glass-chip rounded-xl px-3 py-2.5">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      {origin.stop ? (
        <>
          <div className="text-sm font-semibold text-slate-800">{origin.stop.name}</div>
          <div className="text-xs text-slate-500">
            {linesForStop(origin.stop).map(line => line.longName).join(' · ')}
          </div>
        </>
      ) : (
        <div className="text-sm font-mono text-slate-700">{formatCoord(origin.at)}</div>
      )}
    </div>
  );
}

/**
 * The study-area bounding box is not yet agreed — it depends on the mode-scope decision
 * and the extent of the bus feed, neither of which is settled. Rather than fill the value
 * in with a guess, the box is derived from the loaded rail network and its basis is
 * stated here, so the reader can see what "covered area" currently means.
 */
function CoveredAreaNote() {
  return (
    <div className="absolute bottom-4 left-4 sm:left-6 z-[500] max-w-[calc(100vw-2rem)]">
      <div className="glass p-3 max-w-sm">
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700">Covered area</span> is the extent of the
          loaded rail network plus {STUDY_AREA_BUFFER_KM} km. This is provisional — the study-area
          boundary has not been agreed and depends on the bus feed, which is not yet loaded.
        </p>
      </div>
    </div>
  );
}
