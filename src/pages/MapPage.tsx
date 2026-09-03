import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {CircleHelp, Crosshair, Maximize2, Minimize2, X,} from 'lucide-react';import { Tooltip } from '@/shared/ui';
import {
  BaseMap,
  LocationSearch,
  TimeBudgetSelector,
  useReachability,
  type ReachabilityState,
} from '@/features/reachability';
import {
  formatCoord,
  STUDY_AREA_BUFFER_KM,
  BUDGET_COMPONENTS,
  BUDGET_ASSUMPTIONS,
  originFromHit,
  hitFromOrigin,
  type SearchHit,
} from '@/features/reachability/reachabilityService';
import { linesForStop } from '@/shared/data/adapters/gtfsAdapter';

// Epic3
import {FirstMileMapLayer, useFirstMile, } from '@/features/first-mile';
import {MapAnalysisPanel,type MapAnalysisTab,} from './components/MapAnalysisPanel';

interface MapPageProps {
  initialLocation: SearchHit | null;
  onToast: (message: string, icon?: string) => void;
}

export function MapPage({ initialLocation, onToast }: MapPageProps) {
  const [configOpen, setConfigOpen] = useState(true);
  const reach = useReachability(
    initialLocation ? originFromHit(initialLocation) : null,
    onToast,
  );
  const firstMile = useFirstMile(reach.origin?.at ?? null, reach.timeBudget,);
  const [analysisTab, setAnalysisTab,] = useState<MapAnalysisTab>('first-mile');

  return (
    // top-16 rather than pt-16: an absolutely positioned child resolves inset-0 against
    // the padding box, so padding here would let the map slide under the navbar.
    <div className="fixed left-0 right-0 bottom-0 top-16 overflow-hidden">
      <div className="absolute inset-0">
        <BaseMap
          origin={reach.origin}
          regions={
            reach.state.status === 'ready'
              ? reach.state.result.regions
              : null
          }
          onMapClick={reach.selectPoint}
        >
          {analysisTab === 'first-mile' &&
            firstMile.state.status ===
              'ready' && (
              <FirstMileMapLayer
                stops={
                  firstMile.state.stops
                }
                selectedStopId={
                  firstMile.selectedStopId
                }
                onSelect={
                  firstMile.setSelectedStopId
                }
              />
            )}
        </BaseMap>
      </div>

      <MapAnalysisPanel
        reachState={reach.state}
        firstMileState={
          firstMile.state
        }
        timeBudget={
          reach.timeBudget
        }
        selectedStopId={
          firstMile.selectedStopId
        }
        onSelectStop={
          firstMile.setSelectedStopId
        }
        onRetryReachability={
          reach.retry
        }
        activeTab={
          analysisTab
        }
        onTabChange={
          setAnalysisTab
        }
      />

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
                onSelect={hit =>
                  hit.kind === 'stop' ? reach.selectStop(hit.stop) : reach.selectPlace(hit.place)
                }
                selected={hitFromOrigin(reach.origin)}
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
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-500">Time Budget</label>
                  <BudgetCompositionHelp />
                </div>
                <TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} />
              </div>

              <div className="pt-2 border-t border-slate-200/70">
                <CoveredAreaNote />
              </div>
            </div>
          )}
        </div>
      </div>
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
    : origin.source === 'place' ? 'Selected place'
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
      ) : origin.place ? (
        <>
          <div className="text-sm font-semibold text-slate-800">{origin.place.name}</div>
          {/* The coordinate is still shown: a place is a single point standing for
              something with area, and the reachable area is computed from that point. */}
          <div className="text-xs text-slate-500">
            {origin.place.kindLabel} · <span className="font-mono">{formatCoord(origin.at)}</span>
          </div>
        </>
      ) : (
        <div className="text-sm font-mono text-slate-700">{formatCoord(origin.at)}</div>
      )}
    </div>
  );
}

/**
 * AC 1.2.3 — what the travel time budget is spent on.
 *
 * A help control beside the Time Budget label, not a dropdown. This is reference
 * information about a value the user has already chosen, not a second choice to make, so
 * a disclosure that occupies permanent panel space overstates it. The criterion is
 * triggered by the user "viewing how the travel time was arrived at", which this
 * satisfies exactly as the previous disclosure did — everything it must state is still
 * here, and no component is dropped for being unmodelled.
 *
 * Deliberately mirrors DataBasisHelp in MapAnalysisPanel: same icon, same trigger
 * behaviour (hover on desktop, focus for keyboard, click for touch), same panel styling,
 * so the two read as one system.
 *
 * The one difference is `fixed` rather than `absolute` positioning. The configuration
 * panel is an `overflow-y-auto overflow-x-hidden` scroll container, so an absolutely
 * positioned child would be clipped at its edges instead of overflowing them. Anchoring
 * to the trigger's viewport rect escapes the clip, and keeps the panel on screen on a
 * narrow viewport where there is no room to its right.
 *
 * The wording is deliberately a rider's, not the project's: what counts against the
 * budget and what is missing from it, with no epic names or internal owners.
 */
const PANEL_WIDTH = 300;
const PANEL_GAP = 10;
const PANEL_MARGIN = 8;
/** Enough of the panel to be worth opening; below this it is shifted up instead. */
const PANEL_MIN_VISIBLE = 220;

function BudgetCompositionHelp() {
  // Open is derived from three independent inputs rather than being a single flag that
  // each handler sets. With one flag, a mouse user who hovers (opening it) and then
  // clicks would have the click *toggle it shut* — the pointer enters before the click
  // lands, so the two fight each other. Deriving it means a click can only ever pin the
  // panel open, and hover, focus and pin cannot contradict one another.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  /** Escape hides the panel while the pointer or focus is still on the trigger. */
  const [dismissed, setDismissed] = useState(false);

  const open = !dismissed && (hovered || focused || pinned);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();

    // documentElement.clientWidth, not window.innerWidth: innerWidth includes the
    // scrollbar gutter, so clamping against it leaves the panel hanging over the edge on
    // a narrow viewport.
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;

    // Prefer clear of the configuration panel, to the right of the trigger. On a narrow
    // viewport there is no such room, so clamp inside the right edge instead.
    let left = rect.right + PANEL_GAP;
    if (left + PANEL_WIDTH > viewportW - PANEL_MARGIN) {
      left = Math.max(PANEL_MARGIN, viewportW - PANEL_WIDTH - PANEL_MARGIN);
    }

    const top = Math.max(
      PANEL_MARGIN,
      Math.min(rect.top, viewportH - PANEL_MARGIN - PANEL_MIN_VISIBLE),
    );
    setPos({ top, left, maxHeight: viewportH - top - PANEL_MARGIN });
  }, []);

  /**
   * Corrects the placement against the panel's real rendered box.
   *
   * The first pass positions from the trigger and an assumed panel width. This one
   * measures what actually rendered and nudges it back inside the viewport if anything —
   * a wider-than-expected panel, a scrollbar, a mid-animation layout — put it over an
   * edge. It converges in one step: after the nudge the box is inside, so the guard below
   * stops it re-running.
   */
  useLayoutEffect(() => {
    if (!open || !pos) return;
    const panel = panelRef.current;
    if (!panel) return;

    const box = panel.getBoundingClientRect();
    const viewportW = document.documentElement.clientWidth;
    const viewportH = document.documentElement.clientHeight;

    let dx = 0;
    let dy = 0;
    if (box.right > viewportW - PANEL_MARGIN) dx = viewportW - PANEL_MARGIN - box.right;
    if (box.left + dx < PANEL_MARGIN) dx = PANEL_MARGIN - box.left;
    if (box.bottom > viewportH - PANEL_MARGIN) dy = viewportH - PANEL_MARGIN - box.bottom;
    if (box.top + dy < PANEL_MARGIN) dy = PANEL_MARGIN - box.top;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      setPos(current => current && { ...current, left: current.left + dx, top: current.top + dy });
    }
  }, [open, pos]);

  // Position before paint, so the panel never appears at a stale location first.
  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener('resize', place);
    // Capture phase: the configuration panel scrolls internally, and that scroll does not
    // bubble. Without this the panel would detach from its trigger.
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDismissed(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => { setHovered(true); setDismissed(false); }}
      onMouseLeave={() => { setHovered(false); setPinned(false); setDismissed(false); }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="How this travel time is calculated"
        aria-expanded={open}
        // Pins the panel open. On a touch device there is no hover, so this is the only
        // way in; with a mouse it keeps the panel up after the pointer moves away.
        onClick={() => { setPinned(value => !value); setDismissed(false); }}
        onFocus={() => { setFocused(true); setDismissed(false); }}
        onBlur={() => { setFocused(false); setPinned(false); setDismissed(false); }}
        className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-teal-600 transition"
      >
        <CircleHelp size={14} />
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          role="tooltip"
          className="fixed z-[1000] rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl p-3.5 overflow-y-auto scrollbar-thin"
          style={{
            top: pos.top,
            left: pos.left,
            maxHeight: pos.maxHeight,
            // Never wider than the viewport allows, so a 320px phone still fits it.
            width: `min(${PANEL_WIDTH}px, calc(100vw - ${PANEL_MARGIN * 2}px))`,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-2.5">
            How this travel time is calculated
          </div>

          <ul className="space-y-1.5">
            {BUDGET_COMPONENTS.map(component => (
              <li key={component.label} className="text-[11px] leading-snug">
                <span className="font-semibold text-slate-700">{component.label}</span>
                {component.estimate && (
                  <span className="ml-1.5 px-1 py-px rounded bg-amber-100 text-amber-800 font-semibold text-[10px] uppercase tracking-wide">
                    Not counted
                  </span>
                )}
                <div className="text-slate-500">{component.status}</div>
              </li>
            ))}
          </ul>

          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            {BUDGET_ASSUMPTIONS.map(assumption => (
              <div key={assumption.label} className="text-[11px] leading-snug">
                <span className="font-semibold text-slate-700">{assumption.label}:</span>{' '}
                <span className="text-slate-500">{assumption.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * What "covered area" means — the bound a map click is rejected against.
 *
 * The study-area boundary is not yet agreed: it depends on the extent of the bus feed,
 * which is not loaded. Rather than invent a boundary, it is derived from the rail network
 * actually loaded, and that basis is stated here so the reader can see what the limit is.
 *
 * Lives inside the configuration panel rather than floating over the map. As a separate
 * bottom-left box it collided with the panel above it once the travel-time disclosure was
 * expanded — two independently positioned overlays sharing one column will always be one
 * content change away from overlapping. Keeping it in the panel's flow removes the class
 * of bug rather than re-tuning heights.
 */
function CoveredAreaNote() {
  return (
    <p className="text-[11px] text-slate-500 leading-relaxed">
      <span className="font-semibold text-slate-600">Covered area</span> is the extent of the
      loaded rail network plus {STUDY_AREA_BUFFER_KM} km. This is provisional — the boundary
      depends on the bus feed, which is not yet loaded.
    </p>
  );
}
