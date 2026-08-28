import { useState, useEffect } from 'react';
import { Home, Map, Building2, Clock, Route, TrendingUp, BookOpen, type LucideIcon } from 'lucide-react';
import { NavBar, ToastContainer, PageTransition, type PageId } from '@/components/GlassUI';
import { useToasts } from '@/hooks/useAnimations';
import { LandingPage } from '@/pages/LandingPage';
import { MapPage } from '@/pages/MapPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { TimeComparisonPage } from '@/pages/TimeComparisonPage';
import { ScenarioPage } from '@/pages/ScenarioPage';
import { TypologyPage } from '@/pages/TypologyPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import type { SearchResult } from '@/data/mockData';

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'services', label: 'Services', icon: Building2 },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'scenario', label: 'Scenarios', icon: Route },
  { id: 'typology', label: 'Typology', icon: TrendingUp },
  { id: 'methodology', label: 'Method', icon: BookOpen },
];

function App() {
  const [activePage, setActivePage] = useState<PageId>('landing');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const { toasts, addToast, removeToast } = useToasts();

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSelect = (result: SearchResult) => {
    setSearchResult(result);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <NavBar items={NAV_ITEMS} activePage={activePage} onNavigate={handleNavigate} />

      <PageTransition pageKey={activePage}>
        {activePage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} onSearchSelect={handleSearchSelect} />
        )}
        {activePage === 'map' && (
          <MapPage initialLocation={searchResult} onToast={addToast} />
        )}
        {activePage === 'services' && <ServicesPage />}
        {activePage === 'time' && <TimeComparisonPage />}
        {activePage === 'scenario' && <ScenarioPage />}
        {activePage === 'typology' && <TypologyPage />}
        {activePage === 'methodology' && <MethodologyPage />}
      </PageTransition>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
