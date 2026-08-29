import { useState } from 'react';
import { Bookmark, Footprints, Layers, Maximize2, Minimize2, Navigation, Train } from 'lucide-react';
import { TRANSIT_LINES } from '@/shared/data';
import { TransitMap, OriginMarker, ReachabilityLayer, Legend } from '@/shared/map';
import { Drawer, Tooltip } from '@/shared/ui';
import { usePrefersReducedMotion } from '@/shared/hooks';
import type { SearchResult } from '@/shared/types/location';
import {
  LocationSearch,
  TimeBudgetSelector,
  ModeSelector,
  CalculateButton,
  CalcProgress,
  ReachabilitySummary,
  useReachability,
} from '@/features/reachability';
import { WalkingRouteLayer, useFirstMile } from '@/features/first-mile';
import {
  ServiceDetail,
  ServiceFilters,
  ServiceMarker,
  useEssentialServices,
} from '@/features/essential-services';

interface MapPageProps {
  initialLocation: SearchResult | null;
  onToast: (message: string, icon?: string) => void;
}

export function MapPage({ initialLocation, onToast }: MapPageProps) {
  const reduced = usePrefersReducedMotion();
  const [configOpen, setConfigOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reach = useReachability(initialLocation, onToast);
  const { nearbyStops } = useFirstMile(reach.origin, reach.modes);
  const services = useEssentialServices(reach.polygon, reach.hasResults);

  const handleSave = () => {
    if (!reach.location) return;
    setSaved(prev => !prev);
    if (!saved) onToast(`${reach.location.name} saved`, '★');
  };

  return (
    <div className="fixed inset-0 pt-16 overflow-hidden">
      <div className="absolute inset-0">
        <TransitMap
          showTransit
          showRoads
          highlightedLines={reach.highlightedLines}
          fadedLines={reach.hasResults ? TRANSIT_LINES.filter(line => !reach.highlightedLines.includes(line.id)).map(line => line.id) : []}
        />
      </div>

      <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
        {reach.showWalking && <WalkingRouteLayer origin={reach.origin} stops={nearbyStops.slice(0, 6)} animate={!reduced} />}
        {reach.showPolygon && (
          <g
            onMouseEnter={() => reach.setHoveredPolygon(true)}
            onMouseLeave={() => reach.setHoveredPolygon(false)}
            style={{ pointerEvents: 'auto' }}
          >
            <ReachabilityLayer points={reach.polygon} color="#14b8a6" fillOpacity={0.18} animate={!reduced} hovered={reach.hoveredPolygon} band="main" />
          </g>
        )}
        {reach.showPins && services.reachableServices.map((service, i) => (
          <ServiceMarker
            key={service.id}
            service={service}
            animateIn={!reduced}
            index={i}
            hovered={services.hoveredService?.id === service.id}
            selected={services.selectedService?.id === service.id}
            dimmed={services.selectedService !== null && services.selectedService.id !== service.id}
            onClick={() => {
              services.setSelectedService(service);
              setDrawerOpen(true);
            }}
            onHover={services.setHoveredService}
          />
        ))}
        {reach.location && <OriginMarker pos={reach.origin} animate={!reduced} showPulse={reach.showPolygon} />}
      </svg>

      <div className={`absolute top-20 left-4 sm:left-6 transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="glass p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            {configOpen && <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Configuration</h2>}
            <Tooltip content={configOpen ? 'Collapse' : 'Expand'}>
              <button onClick={() => setConfigOpen(prev => !prev)} className="btn-icon ml-auto" style={{ width: 32, height: 32 }}>
                {configOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
          </div>

          {configOpen && (
            <div className="space-y-4 fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Starting Location</label>
                <LocationSearch onSelect={reach.selectLocation} selected={reach.location} compact />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Time Budget</label>
                <TimeBudgetSelector value={reach.timeBudget} onChange={reach.changeTimeBudget} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Transport Modes</label>
                <ModeSelector
                  modes={[
                    { id: 'walk', label: 'Walk', icon: Footprints },
                    { id: 'bus', label: 'Bus', icon: Navigation },
                    { id: 'lrt', label: 'LRT', icon: Train },
                    { id: 'brt', label: 'BRT', icon: Train },
                    { id: 'mrt', label: 'MRT', icon: Train },
                  ]}
                  selected={reach.modes}
                  onToggle={reach.toggleMode}
                />
              </div>
              <CalculateButton onClick={reach.calculate} calculating={reach.calculating} disabled={!reach.location} />
              {reach.calculating && <CalcProgress step={reach.calcStep} steps={reach.CALC_STEPS} />}
            </div>
          )}
        </div>
      </div>

      {reach.hasResults && !reach.calculating && (
        <ReachabilitySummary areaKm2={reach.areaKm2} serviceCount={services.reachableServices.length} stopCount={nearbyStops.length} />
      )}

      {reach.hasResults && (
        <div className="absolute bottom-4 left-4 sm:left-6 max-w-[calc(100vw-2rem)]">
          <div className="glass p-3.5 max-w-md">
            <div className="flex items-center gap-2 mb-2.5">
              <Layers size={14} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Service Categories</span>
            </div>
            <ServiceFilters selected={services.selectedCategories} onToggle={services.toggleCategory} counts={services.categoryCounts} compact />
          </div>
        </div>
      )}

      {reach.hasResults && (
        <div className="absolute bottom-4 right-4 sm:right-6 hidden md:block">
          <Legend items={[
            { label: 'Reachable area', color: '#14b8a6', type: 'fill' },
            { label: 'Walking path', color: '#14b8a6', type: 'dashed' },
            { label: 'LRT line', color: '#e11d48' },
            { label: 'BRT line', color: '#2563eb' },
            { label: 'MRT line', color: '#7c3aed' },
            { label: 'Bus route', color: '#f59e0b' },
          ]} />
        </div>
      )}

      {reach.location && (
        <div className="absolute top-20 right-4 sm:right-6 md:hidden">
          <Tooltip content={saved ? 'Saved' : 'Save place'}>
            <button onClick={handleSave} className="btn-icon" style={{ background: saved ? 'rgba(20,184,166,0.15)' : undefined }}>
              <Bookmark size={18} fill={saved ? '#0d9488' : 'none'} color={saved ? '#0d9488' : undefined} />
            </button>
          </Tooltip>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={services.selectedService?.name}>
        {services.selectedService && <ServiceDetail service={services.selectedService} />}
      </Drawer>
    </div>
  );
}
