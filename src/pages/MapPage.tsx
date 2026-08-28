import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { MapPin, Clock, Footprints, Train, Building2, Maximize2, Minimize2, Bookmark, Layers, Navigation, X, Star, Accessibility, Timer, TrendingUp } from 'lucide-react';
import { CityMap } from '@/components/CityMap';
import { ReachPolygon, OriginMarker, ServicePin, WalkingPaths, servicesInPolygon, nearbyStops } from '@/components/MapOverlays';
import { LocationSearch, TimeBudgetChips, ModeFilters, CategoryFilters, CalculateButton, CalcProgress, ResultCard, Legend, ConfidenceGauge } from '@/components/ConfigPanel';
import { Drawer, Tooltip } from '@/components/GlassUI';
import { generateReachPolygon, polygonArea, mapAreaToKm2, type MapPoint } from '@/utils/geometry';
import { usePrefersReducedMotion, useToasts } from '@/hooks/useAnimations';
import { SERVICES, TRANSIT_LINES, CITY_CENTER, CATEGORY_META, type ServiceLocation, type ServiceCategory, type SearchResult } from '@/data/mockData';

interface MapPageProps {
  initialLocation: SearchResult | null;
  onToast: (message: string, icon?: string) => void;
}

const CALC_STEPS = [
  'Finding walkable transit stops...',
  'Checking scheduled connections...',
  'Estimating transfers...',
  'Mapping essential services...',
];

export function MapPage({ initialLocation, onToast }: MapPageProps) {
  const reduced = usePrefersReducedMotion();
  const [location, setLocation] = useState<SearchResult | null>(initialLocation);
  const [timeBudget, setTimeBudget] = useState(30);
  const [modes, setModes] = useState<Set<string>>(new Set(['walk', 'bus', 'lrt', 'brt']));
  const [selectedCategories, setSelectedCategories] = useState<Set<ServiceCategory>>(new Set(['hospital', 'clinic', 'pharmacy', 'school', 'market']));
  const [calculating, setCalculating] = useState(false);
  const [calcStep, setCalcStep] = useState(-1);
  const [hasResults, setHasResults] = useState(false);
  const [showWalking, setShowWalking] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [showPolygon, setShowPolygon] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<ServiceLocation | null>(null);
  const [selectedPin, setSelectedPin] = useState<ServiceLocation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [hoveredPolygon, setHoveredPolygon] = useState(false);

  const origin = location?.pos ?? CITY_CENTER;

  const polygon = useMemo(() => generateReachPolygon(origin, timeBudget, 42), [origin, timeBudget]);
  const areaKm2 = useMemo(() => mapAreaToKm2(polygonArea(polygon)), [polygon]);

  const allStops = useMemo(() => {
    const stops: MapPoint[] = [];
    TRANSIT_LINES.forEach(line => {
      if (modes.has(line.type) || (line.type === 'lrt' && modes.has('lrt')) || (line.type === 'brt' && modes.has('brt')) || (line.type === 'mrt' && modes.has('mrt')) || (line.type === 'bus' && modes.has('bus'))) {
        line.stops.forEach(stop => stops.push(stop.pos));
      }
    });
    return stops;
  }, [modes]);

  const nearby = useMemo(() => nearbyStops(origin, allStops, 80), [origin, allStops]);
  const reachableServices = useMemo(() => {
    if (!hasResults) return [];
    return servicesInPolygon(SERVICES, polygon).filter(s => selectedCategories.has(s.category));
  }, [polygon, hasResults, selectedCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ServiceCategory, number>> = {};
    servicesInPolygon(SERVICES, polygon).forEach(s => {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    });
    return counts;
  }, [polygon]);

  const highlightedLines = useMemo(() => {
    if (!hasResults) return [];
    return TRANSIT_LINES.filter(line => {
      return line.stops.some(stop => Math.hypot(stop.pos.x - origin.x, stop.pos.y - origin.y) < 100);
    }).map(l => l.id);
  }, [hasResults, origin]);

  const handleCalculate = () => {
    if (!location) {
      onToast('Please select a starting location', '!');
      return;
    }
    setCalculating(true);
    setCalcStep(0);
    setShowWalking(false);
    setShowPolygon(false);
    setShowPins(false);

    // Animate through calculation steps
    const stepInterval = reduced ? 50 : 200;
    let step = 0;
    const stepTimer = setInterval(() => {
      step++;
      setCalcStep(step);
      if (step >= CALC_STEPS.length) {
        clearInterval(stepTimer);
      }
    }, stepInterval);

    // Reveal walking paths
    setTimeout(() => setShowWalking(true), reduced ? 50 : 300);
    // Reveal polygon
    setTimeout(() => setShowPolygon(true), reduced ? 100 : 600);
    // Reveal pins
    setTimeout(() => setShowPins(true), reduced ? 150 : 1000);

    const totalTime = reduced ? 200 : 1100;
    setTimeout(() => {
      setCalculating(false);
      setHasResults(true);
      onToast(`Reach calculated for ${location.name}`, '✓');
    }, totalTime);
  };

  const handlePinClick = (service: ServiceLocation) => {
    setSelectedPin(service);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!location) return;
    setSaved(!saved);
    if (!saved) {
      onToast(`${location.name} saved`, '★');
    }
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleMode = (id: string) => {
    setModes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 pt-16 overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0">
        <CityMap
          showTransit={true}
          showRoads={true}
          highlightedLines={highlightedLines}
          fadedLines={hasResults ? TRANSIT_LINES.filter(l => !highlightedLines.includes(l.id)).map(l => l.id) : []}
        />
      </div>

      {/* Map overlays */}
      <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
        {showWalking && <WalkingPaths origin={origin} stops={nearby.slice(0, 6)} animate={!reduced} />}
        {showPolygon && (
          <g onMouseEnter={() => setHoveredPolygon(true)} onMouseLeave={() => setHoveredPolygon(false)} style={{ pointerEvents: 'auto' }}>
            <ReachPolygon points={polygon} color="#14b8a6" fillOpacity={0.18} animate={!reduced} hovered={hoveredPolygon} band="main" />
          </g>
        )}
        {showPins && reachableServices.map((s, i) => (
          <ServicePin
            key={s.id}
            service={s}
            animateIn={!reduced}
            index={i}
            hovered={hoveredPin?.id === s.id}
            selected={selectedPin?.id === s.id}
            dimmed={selectedPin !== null && selectedPin.id !== s.id}
            onClick={() => handlePinClick(s)}
            onHover={setHoveredPin}
          />
        ))}
        {location && <OriginMarker pos={origin} animate={!reduced} showPulse={showPolygon} />}
      </svg>

      {/* Config panel (left) */}
      <div className={`absolute top-20 left-4 sm:left-6 transition-all duration-300 ease-out ${configOpen ? 'w-[340px] max-w-[calc(100vw-2rem)]' : 'w-12'}`}>
        <div className="glass p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            {configOpen && <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Configuration</h2>}
            <Tooltip content={configOpen ? 'Collapse' : 'Expand'}>
              <button onClick={() => setConfigOpen(!configOpen)} className="btn-icon ml-auto" style={{ width: 32, height: 32 }}>
                {configOpen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </Tooltip>
          </div>

          {configOpen && (
            <div className="space-y-4 fade-in">
              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Starting Location</label>
                <LocationSearch onSelect={(r) => { setLocation(r); setHasResults(false); }} selected={location} compact />
              </div>

              {/* Time budget */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Time Budget</label>
                <TimeBudgetChips value={timeBudget} onChange={(v) => { setTimeBudget(v); if (hasResults) { setShowPolygon(false); setShowPins(false); setTimeout(() => { setShowPolygon(true); setShowPins(true); }, 100); } }} />
              </div>

              {/* Mode filters */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Transport Modes</label>
                <ModeFilters
                  modes={[
                    { id: 'walk', label: 'Walk', icon: Footprints },
                    { id: 'bus', label: 'Bus', icon: Navigation },
                    { id: 'lrt', label: 'LRT', icon: Train },
                    { id: 'brt', label: 'BRT', icon: Train },
                    { id: 'mrt', label: 'MRT', icon: Train },
                  ]}
                  selected={modes}
                  onToggle={toggleMode}
                />
              </div>

              {/* Calculate button */}
              <CalculateButton onClick={handleCalculate} calculating={calculating} disabled={!location} />

              {/* Progress */}
              {calculating && <CalcProgress step={calcStep} steps={CALC_STEPS} />}
            </div>
          )}
        </div>
      </div>

      {/* Result cards (top-right) */}
      {hasResults && !calculating && (
        <div className="absolute top-20 right-4 sm:right-6 flex flex-col gap-3 w-[200px] sm:w-[220px]">
          <ResultCard icon={MapPin} label="Reachable Area" value={areaKm2} unit="km²" decimals={1} delay={0} />
          <ResultCard icon={Building2} label="Services" value={reachableServices.length} unit="" delay={80} color="#e11d48" />
          <ResultCard icon={Train} label="Transit Stops" value={nearby.length} unit="" delay={160} color="#2563eb" />
          <div className="glass p-4 fade-slide-up" style={{ animationDelay: '240ms' }}>
            <ConfidenceGauge grade="B" score={78} />
          </div>
        </div>
      )}

      {/* Category filters (bottom-left) */}
      {hasResults && (
        <div className="absolute bottom-4 left-4 sm:left-6 max-w-[calc(100vw-2rem)]">
          <div className="glass p-3.5 max-w-md">
            <div className="flex items-center gap-2 mb-2.5">
              <Layers size={14} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Service Categories</span>
            </div>
            <CategoryFilters selected={selectedCategories} onToggle={toggleCategory} counts={categoryCounts} compact />
          </div>
        </div>
      )}

      {/* Legend (bottom-right) */}
      {hasResults && (
        <div className="absolute bottom-4 right-4 sm:right-6 hidden md:block">
          <Legend
            items={[
              { label: 'Reachable area', color: '#14b8a6', type: 'fill' },
              { label: 'Walking path', color: '#14b8a6', type: 'dashed' },
              { label: 'LRT line', color: '#e11d48' },
              { label: 'BRT line', color: '#2563eb' },
              { label: 'MRT line', color: '#7c3aed' },
              { label: 'Bus route', color: '#f59e0b' },
            ]}
          />
        </div>
      )}

      {/* Save button */}
      {location && (
        <div className="absolute top-20 right-4 sm:right-6 md:hidden">
          <Tooltip content={saved ? 'Saved' : 'Save place'}>
            <button onClick={handleSave} className="btn-icon" style={{ background: saved ? 'rgba(20,184,166,0.15)' : undefined }}>
              <Bookmark size={18} fill={saved ? '#0d9488' : 'none'} color={saved ? '#0d9488' : undefined} />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Service detail drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selectedPin?.name}>
        {selectedPin && <ServiceDetail service={selectedPin} />}
      </Drawer>
    </div>
  );
}

function ServiceDetail({ service }: { service: ServiceLocation }) {
  const meta = CATEGORY_META[service.category];
  const Icon = meta.icon;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: meta.colorLight }}>
          <Icon size={28} style={{ color: meta.color }} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-sm text-slate-500">{service.address}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Footprints size={14} className="text-teal-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Walk Time</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{service.walkMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Train size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Transit Time</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{service.transitMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Wait Time</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{service.waitingMin} min</div>
        </div>
        <div className="glass-chip p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rating</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{service.rating} / 5</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Opening Hours</div>
        <div className="glass-chip px-3 py-2 text-sm font-semibold text-slate-700">{service.hours}</div>
      </div>

      <div>
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Accessibility</div>
        <div className="flex items-center gap-2 glass-chip px-3 py-2">
          <Accessibility size={16} className={service.accessible ? 'text-teal-600' : 'text-slate-400'} />
          <span className="text-sm font-semibold text-slate-700">
            {service.accessible ? 'Wheelchair accessible' : 'Limited accessibility'}
          </span>
        </div>
      </div>

      <button className="btn-primary w-full flex items-center justify-center gap-2">
        <Navigation size={16} />
        Get Directions
      </button>
    </div>
  );
}
