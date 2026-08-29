import { useMemo, useState } from 'react';
import { CITY_CENTER } from '@/shared/data';
import type { SearchResult } from '@/shared/types/location';
import { usePrefersReducedMotion } from '@/shared/hooks';
import { calculatePrototypeReachability, getHighlightedTransitLineIds } from '../reachabilityService';

const CALC_STEPS = [
  'Finding walkable transit stops...',
  'Checking scheduled connections...',
  'Estimating transfers...',
  'Mapping essential services...',
];

export function useReachability(
  initialLocation: SearchResult | null,
  onToast: (message: string, icon?: string) => void,
) {
  const reduced = usePrefersReducedMotion();
  const [location, setLocation] = useState<SearchResult | null>(initialLocation);
  const [timeBudget, setTimeBudget] = useState(30);
  const [modes, setModes] = useState<Set<string>>(new Set(['walk', 'bus', 'lrt', 'brt']));
  const [calculating, setCalculating] = useState(false);
  const [calcStep, setCalcStep] = useState(-1);
  const [hasResults, setHasResults] = useState(false);
  const [showWalking, setShowWalking] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [showPolygon, setShowPolygon] = useState(false);
  const [hoveredPolygon, setHoveredPolygon] = useState(false);

  const origin = location?.pos ?? CITY_CENTER;
  const { polygon, areaKm2 } = useMemo(
    () => calculatePrototypeReachability(origin, timeBudget),
    [origin, timeBudget],
  );
  const highlightedLines = useMemo(
    () => getHighlightedTransitLineIds(origin, hasResults),
    [origin, hasResults],
  );

  const selectLocation = (next: SearchResult) => {
    setLocation(next);
    setHasResults(false);
    setShowWalking(false);
    setShowPolygon(false);
    setShowPins(false);
  };

  const changeTimeBudget = (minutes: number) => {
    setTimeBudget(minutes);
    if (hasResults) {
      setShowPolygon(false);
      setShowPins(false);
      setTimeout(() => {
        setShowPolygon(true);
        setShowPins(true);
      }, 100);
    }
  };

  const toggleMode = (id: string) => {
    setModes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const calculate = () => {
    if (!location) {
      onToast('Please select a starting location', '!');
      return;
    }

    setCalculating(true);
    setCalcStep(0);
    setShowWalking(false);
    setShowPolygon(false);
    setShowPins(false);

    const stepInterval = reduced ? 50 : 200;
    let step = 0;
    const stepTimer = window.setInterval(() => {
      step += 1;
      setCalcStep(step);
      if (step >= CALC_STEPS.length) window.clearInterval(stepTimer);
    }, stepInterval);

    window.setTimeout(() => setShowWalking(true), reduced ? 50 : 300);
    window.setTimeout(() => setShowPolygon(true), reduced ? 100 : 600);
    window.setTimeout(() => setShowPins(true), reduced ? 150 : 1000);

    window.setTimeout(() => {
      setCalculating(false);
      setHasResults(true);
      onToast(`Reach calculated for ${location.name}`, '✓');
    }, reduced ? 200 : 1100);
  };

  return {
    CALC_STEPS,
    location,
    timeBudget,
    modes,
    calculating,
    calcStep,
    hasResults,
    showWalking,
    showPins,
    showPolygon,
    hoveredPolygon,
    origin,
    polygon,
    areaKm2,
    highlightedLines,
    setHoveredPolygon,
    selectLocation,
    changeTimeBudget,
    toggleMode,
    calculate,
  };
}
