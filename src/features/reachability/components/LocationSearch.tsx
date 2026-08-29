import { useState, type ReactNode } from 'react';
import { Search, MapPin, Train, Building2 } from 'lucide-react';
import { SEARCH_RESULTS } from '@/shared/data';
import type { SearchResult } from '@/shared/types/location';

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
