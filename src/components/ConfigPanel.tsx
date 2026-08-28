import { useState, useEffect, type ReactNode } from 'react';
import { Search, MapPin, Clock, Footprints, Train, Building2, Info, ChevronDown, Loader2, Check } from 'lucide-react';
import { CATEGORY_META, CATEGORY_ORDER, SEARCH_RESULTS, type ServiceCategory, type SearchResult } from '@/data/mockData';
import { usePrefersReducedMotion } from '@/hooks/useAnimations';

// ---- Location Search ----
interface LocationSearchProps {
  onSelect: (result: SearchResult) => void;
  selected?: SearchResult | null;
  compact?: boolean;
}

export function LocationSearch({ onSelect, selected, compact = false }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const results = query.length > 0
    ? SEARCH_RESULTS.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_RESULTS;

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setFocused(false);
  };

  return (
    <div className="relative">
      <div className={`glass-input flex items-center gap-2 px-3.5 py-3 ${focused ? 'ring-2 ring-teal-500/20' : ''} ${compact ? 'text-sm' : ''}`}>
        <Search size={compact ? 16 : 18} className={focused ? 'text-teal-600' : 'text-slate-400'} style={{ transition: 'color 200ms ease-out' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIdx(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIdx(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && highlightedIdx >= 0) {
              handleSelect(results[highlightedIdx]);
            }
          }}
          placeholder="Search area or station..."
          className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
        />
        {selected && (
          <MapPin size={16} className="text-teal-600" />
        )}
      </div>

      {focused && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-strong p-2 z-50 fade-slide-up max-h-64 overflow-y-auto scrollbar-thin">
          {results.map((result, idx) => (
            <button
              key={result.id}
              onMouseEnter={() => setHighlightedIdx(idx)}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                highlightedIdx === idx ? 'bg-teal-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="mt-0.5">
                {result.type === 'station' ? (
                  <Train size={16} className="text-blue-500" />
                ) : result.type === 'landmark' ? (
                  <Building2 size={16} className="text-amber-500" />
                ) : (
                  <MapPin size={16} className="text-teal-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {highlightName(result.name, query)}
                </div>
                <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function highlightName(name: string, query: string): ReactNode {
  if (!query) return name;
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className="text-teal-700 font-bold">{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  );
}

// ---- Time Budget Chips ----
interface TimeBudgetProps {
  value: number;
  onChange: (min: number) => void;
}

export function TimeBudgetChips({ value, onChange }: TimeBudgetProps) {
  const options = [15, 30, 45, 60];
  return (
    <div className="relative flex items-center gap-1.5 p-1 glass-chip rounded-xl">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`chip ${value === opt ? 'chip-selected' : 'chip-unselected'}`}
          style={{ padding: '6px 14px' }}
        >
          {opt} min
        </button>
      ))}
    </div>
  );
}

// ---- Mode Filters ----
interface ModeFiltersProps {
  modes: { id: string; label: string; icon: typeof Footprints }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function ModeFilters({ modes, selected, onToggle }: ModeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = selected.has(mode.id);
        return (
          <button
            key={mode.id}
            onClick={() => onToggle(mode.id)}
            className={`chip ${isSelected ? 'chip-selected' : 'chip-unselected'}`}
          >
            <span className="relative w-4 h-4 flex items-center justify-center">
              {isSelected && (
                <svg width="16" height="16" viewBox="0 0 16 16" className="check-draw">
                  <path d="M3 8 L7 12 L13 4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {!isSelected && <Icon size={14} />}
            </span>
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Category Filters ----
interface CategoryFiltersProps {
  selected: Set<ServiceCategory>;
  onToggle: (cat: ServiceCategory) => void;
  counts?: Partial<Record<ServiceCategory, number>>;
  compact?: boolean;
}

export function CategoryFilters({ selected, onToggle, counts, compact = false }: CategoryFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'gap-1.5' : ''}`}>
      {CATEGORY_ORDER.map((catId) => {
        const meta = CATEGORY_META[catId];
        const Icon = meta.icon;
        const isSelected = selected.has(catId);
        const count = counts?.[catId];
        return (
          <button
            key={catId}
            onClick={() => onToggle(catId)}
            className={`chip ${isSelected ? 'chip-selected' : 'chip-unselected'}`}
            style={compact ? { padding: '6px 10px', fontSize: 12 } : undefined}
          >
            <Icon size={compact ? 13 : 15} style={{ color: isSelected ? 'white' : meta.color }} />
            {meta.label}
            {count !== undefined && count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isSelected ? 'bg-white/25' : 'bg-slate-200/60 text-slate-600'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- Calculate Button ----
interface CalculateButtonProps {
  onClick: () => void;
  calculating: boolean;
  disabled?: boolean;
  label?: string;
  calculatingLabel?: string;
}

export function CalculateButton({
  onClick, calculating, disabled = false,
  label = 'Calculate Reach', calculatingLabel = 'Calculating reach...',
}: CalculateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || calculating}
      className="btn-primary w-full flex items-center justify-center gap-2"
    >
      {calculating ? (
        <>
          <Loader2 size={18} className="spinner" />
          <span>{calculatingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ---- Calculation Progress ----
interface CalcProgressProps {
  step: number;
  steps: string[];
}

export function CalcProgress({ step, steps }: CalcProgressProps) {
  return (
    <div className="space-y-2 fade-in">
      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors duration-200 ${
              i < step ? 'text-teal-600' : i === step ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            {i < step ? (
              <Check size={12} className="text-teal-600" />
            ) : i === step ? (
              <Loader2 size={12} className="spinner" />
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-slate-300" />
            )}
            <span className="hidden sm:inline">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Result Metric Card ----
interface ResultCardProps {
  icon: typeof MapPin;
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  color?: string;
  delay?: number;
  onHover?: () => void;
  onLeave?: () => void;
}

export function ResultCard({ icon: Icon, label, value, unit, decimals = 0, color = '#0d9488', delay = 0, onHover, onLeave }: ResultCardProps) {
  const reduced = usePrefersReducedMotion();
  const displayValue = useCountUpLocal(value, 800, delay, reduced);
  return (
    <div
      className="glass p-4 card-hover fade-slide-up"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {displayValue.toFixed(decimals)}
        <span className="text-sm font-semibold text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}

function useCountUpLocal(target: number, duration: number, delay: number, reduced: boolean): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (reduced) { setVal(target); return; }
    let raf: number;
    let start: number | null = null;
    const startTime = performance.now() + delay;
    const animate = (now: number) => {
      if (now < startTime) { raf = requestAnimationFrame(animate); return; }
      if (start === null) start = now;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay, reduced]);
  return val;
}

// ---- Map Legend ----
interface LegendProps {
  items: { label: string; color: string; type?: 'solid' | 'dashed' | 'fill' }[];
  title?: string;
  collapsible?: boolean;
}

export function Legend({ items, title = 'Legend', collapsible = true }: LegendProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass p-3.5">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className="flex items-center justify-between w-full mb-2"
        disabled={!collapsible}
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
        {collapsible && (
          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
        )}
      </button>
      {open && (
        <div className="space-y-2 fade-in">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {item.type === 'fill' ? (
                <div className="w-5 h-5 rounded-md" style={{ background: item.color, opacity: 0.3, border: `1.5px solid ${item.color}` }} />
              ) : item.type === 'dashed' ? (
                <div className="w-5 h-0.5" style={{ background: `repeating-linear-gradient(90deg, ${item.color} 0 4px, transparent 4px 7px)` }} />
              ) : (
                <div className="w-5 h-1 rounded-full" style={{ background: item.color }} />
              )}
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Info Badge ----
export function InfoBadge({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Info }) {
  return (
    <div className="glass-chip px-3 py-2 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-teal-600" />}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

// ---- Confidence Gauge ----
export function ConfidenceGauge({ grade, score }: { grade: string; score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 94.2} 94.2`}
            transform="rotate(-90 18 18)"
            style={{ transition: 'stroke-dasharray 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {grade}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase">Confidence</div>
        <div className="text-sm font-bold text-slate-700">{score}%</div>
      </div>
    </div>
  );
}
