import { useState } from 'react';
import { AlertTriangle, Crosshair, Footprints, Loader2, Maximize2, Minimize2, RotateCw, X } from 'lucide-react';
import { Tooltip } from '@/shared/ui';
import {
  BaseMap,
  LocationSearch,
  TimeBudgetSelector,
  useReachability,
  type RailStop,
  type ReachabilityState,
} from '@/features/reachability';
import {
  formatCoord,
  STUDY_AREA_BUFFER_KM,
  BUDGET_COMPONENTS,
  BUDGET_ASSUMPTIONS,
} from '@/features/reachability/reachabilityService';
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
        <BaseMap
          origin={reach.origin}
          regions={reach.state.status === 'ready' ? reach.state.result.regions : null}
          onMapClick={reach.selectPoint}
        />
      </div>

      <ResultPanel state={reach.state} onRetry={reach.retry} />

      {/* The budget composition note makes the panel tall enough to overflow a short
          viewport, so it scrolls internally rather than running off the bottom — the
          note has to stay reachable to satisfy AC 1.2.3. */}
      <div className={`absolute top-4 left-4 sm:left-6 z-[500] max-h-[calc(100%-2rem)] transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="glass p-4 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden scrollbar-thin">
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

              <BudgetCompositionNote />
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
 * The result, and the states that are not a result.
 *
 * AC 1.3.2 requires computing, failure and valid-result states to be visually distinct
 * and never confused with one another. AC 1.2.4's walking-only outcome is a *valid
 * finding*, so it deliberately carries no error styling and no retry control — only the
 * failure state does.
 */
function ResultPanel({
  state,
  onRetry,
}: {
  state: ReachabilityState;
  onRetry: () => void;
}) {
  const [dismissed, setDismissed] = useState<number | null>(null);

  if (state.status === 'idle') return null;

  return (
    <div className="absolute top-4 right-4 sm:right-6 z-[500] w-[300px] max-w-[calc(100vw-2rem)]">
      {state.status === 'computing' && (
        <div className="glass p-3.5 flex items-center gap-2.5">
          <Loader2 size={16} className="spinner text-teal-600 shrink-0" />
          <span className="text-sm font-medium text-slate-700">
            Computing reachable area for {state.budgetMinutes} min…
          </span>
        </div>
      )}

      {state.status === 'failed' && (
        <div className="glass p-3.5 border border-rose-200" style={{ background: 'rgba(255,241,242,0.92)' }}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-900">
                Could not compute the reachable area. Try again.
              </p>
              <button
                onClick={onRetry}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-2.5 mt-2"
              >
                <RotateCw size={13} />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="glass p-3.5">
          {/* AC 1.2.2 — this label comes from the state the area was computed with, never
              from the selector, so the two cannot disagree. */}
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Reachable within {state.budgetMinutes} min
          </div>
          <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {state.result.areaKm2.toFixed(1)}
            <span className="text-sm font-semibold text-slate-400 ml-1">km²</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {state.result.regions.length === 1
              ? 'one continuous area'
              : `${state.result.regions.length} separate areas`}
          </div>

          {/* AC 1.3.1 — the boundary is modelled, not a surveyed line. */}
          <p className="text-[11px] text-slate-400 leading-snug mt-2 pt-2 border-t border-slate-200/70">
            A modelled boundary, not a precise line. A point just outside it is not
            meaningfully less reachable than one just inside.
          </p>

          {/* AC 1.2.4 — a valid finding, not an error. Dismissible, and it does not block
              interaction with the map. */}
          {state.walkingOnly && dismissed !== state.budgetMinutes && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex items-start gap-2">
              <Footprints size={14} className="text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-snug flex-1">
                No public transport can be boarded from this point within{' '}
                {state.budgetMinutes} min. The area shown is walking only.
              </p>
              <button
                onClick={() => setDismissed(state.budgetMinutes)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * AC 1.2.3 — what the travel time budget is spent on.
 *
 * The note is always visible rather than behind a control, because the criterion asks for
 * a *visible* note enumerating the five components. Every component is listed whether or
 * not it is modelled: a component that is not yet modelled says so rather than being
 * dropped, and no blocked value is shown as a number it does not have.
 */
function BudgetCompositionNote() {
  return (
    <div className="glass-chip rounded-xl px-3 py-2.5">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        What the budget is spent on
      </div>

      <ul className="space-y-1.5">
        {BUDGET_COMPONENTS.map(component => (
          <li key={component.label} className="text-[11px] leading-snug">
            <span className="font-semibold text-slate-700">{component.label}</span>
            {component.estimate && (
              <span className="ml-1.5 px-1 py-px rounded bg-amber-100 text-amber-800 font-semibold text-[10px] uppercase tracking-wide">
                Estimate
              </span>
            )}
            <div className="text-slate-500">
              {component.status}
              {component.owner && <span className="text-slate-400"> ({component.owner})</span>}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1">
        {BUDGET_ASSUMPTIONS.map(assumption => (
          <div key={assumption.label} className="text-[11px] leading-snug">
            <span className="font-semibold text-slate-700">{assumption.label}:</span>{' '}
            <span className="text-slate-500">{assumption.status}</span>
            {assumption.owner && <span className="text-slate-400"> ({assumption.owner})</span>}
          </div>
        ))}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        No reachable area is computed yet, so these are the components the budget will be spent
        on rather than a breakdown of a result.
      </p>
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
