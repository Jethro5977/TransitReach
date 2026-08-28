import { useState, useMemo } from 'react';
import { Search, Building2, Star, Clock, Footprints, Accessibility, Filter, ChevronRight } from 'lucide-react';
import { CityMap } from '@/components/CityMap';
import { ServicePin, servicesInPolygon, ReachPolygon, OriginMarker } from '@/components/MapOverlays';
import { CategoryFilters, ConfidenceGauge } from '@/components/ConfigPanel';
import { usePrefersReducedMotion, useCountUp } from '@/hooks/useAnimations';
import { generateReachPolygon } from '@/utils/geometry';
import { SERVICES, CATEGORY_META, CATEGORY_ORDER, CITY_CENTER, type ServiceCategory, type ServiceLocation } from '@/data/mockData';

export function ServicesPage() {
  const reduced = usePrefersReducedMotion();
  const [selectedCats, setSelectedCats] = useState<Set<ServiceCategory>>(new Set(CATEGORY_ORDER));
  const [hoveredService, setHoveredService] = useState<ServiceLocation | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceLocation | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'walk' | 'rating' | 'wait'>('walk');

  const polygon = useMemo(() => generateReachPolygon(CITY_CENTER, 45, 42), []);
  const reachableServices = useMemo(() => servicesInPolygon(SERVICES, polygon), []);

  const filteredServices = useMemo(() => {
    let list = reachableServices.filter(s => selectedCats.has(s.category));
    if (search) {
      list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'walk') return a.walkMin - b.walkMin;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.waitingMin - b.waitingMin;
    });
    return list;
  }, [reachableServices, selectedCats, search, sortBy]);

  const toggleCat = (cat: ServiceCategory) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<ServiceCategory, number>> = {};
    reachableServices.forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1; });
    return counts;
  }, [reachableServices]);

  return (
    <div className="min-h-screen pt-16">
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 15% 20%, rgba(20,184,166,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(37,99,235,0.04) 0%, transparent 50%)' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 fade-slide-up">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Essential Services</h1>
          <p className="text-slate-600">Browse all essential services reachable from the city centre within 45 minutes.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '10/7', minHeight: '400px' }}>
            <CityMap showTransit={false} showRoads={true} />
            <svg viewBox="0 0 1000 700" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
              <ReachPolygon points={polygon} color="#14b8a6" fillOpacity={0.12} animate={!reduced} />
              {filteredServices.map((s, i) => (
                <ServicePin
                  key={s.id}
                  service={s}
                  animateIn={!reduced}
                  index={i}
                  hovered={hoveredService?.id === s.id}
                  selected={selectedService?.id === s.id}
                  dimmed={selectedService !== null && selectedService.id !== s.id}
                  onClick={() => setSelectedService(s)}
                  onHover={setHoveredService}
                />
              ))}
              <OriginMarker pos={CITY_CENTER} animate={!reduced} showPulse />
            </svg>

            {/* Floating summary */}
            <div className="absolute top-4 left-4 glass-strong px-4 py-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Services in Reach</div>
              <ServiceCountDisplay total={filteredServices.length} />
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {/* Search & sort */}
            <div className="glass p-4 space-y-3">
              <div className="glass-input flex items-center gap-2 px-3 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-2">
                {(['walk', 'rating', 'wait'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`chip ${sortBy === s ? 'chip-selected' : 'chip-unselected'}`}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    {s === 'walk' ? 'Nearest' : s === 'rating' ? 'Top Rated' : 'Shortest Wait'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters */}
            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={14} className="text-teal-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter by Category</span>
              </div>
              <CategoryFilters selected={selectedCats} onToggle={toggleCat} counts={categoryCounts} compact />
            </div>

            {/* Service list */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
              {filteredServices.map((service, i) => {
                const meta = CATEGORY_META[service.category];
                const Icon = meta.icon;
                const isHovered = hoveredService?.id === service.id;
                const isSelected = selectedService?.id === service.id;
                return (
                  <div
                    key={service.id}
                    className={`card p-3.5 cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-teal-400' : isHovered ? 'shadow-md' : ''
                    }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    onMouseEnter={() => setHoveredService(service)}
                    onMouseLeave={() => setHoveredService(null)}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.colorLight }}>
                        <Icon size={18} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{service.name}</div>
                        <div className="text-xs text-slate-500 truncate">{service.address}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Footprints size={11} className="text-teal-600" />
                            {service.walkMin}m
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Star size={11} className="text-amber-400" />
                            {service.rating}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Clock size={11} className="text-slate-400" />
                            {service.waitingMin}m wait
                          </span>
                          {service.accessible && (
                            <Accessibility size={12} className="text-teal-600" />
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 mt-1" />
                    </div>
                  </div>
                );
              })}
              {filteredServices.length === 0 && (
                <div className="glass p-8 text-center">
                  <p className="text-sm text-slate-500">No services match your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCountDisplay({ total }: { total: number }) {
  const count = useCountUp(total, 600, 0);
  return <div className="text-2xl font-bold text-slate-900">{Math.round(count)}</div>;
}
