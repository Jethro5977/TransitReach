import {
  Home,
  Map,
  Building2,
  Clock,
  Route,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { PageId } from './routes';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  /**
   * AC 1.5.3 — a screen belonging to an epic that is not yet built is not offered in the
   * navigation. The page component and its PageId are kept intact, so restoring an entry
   * is a one-line change here rather than a re-implementation.
   */
  hidden?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'services', label: 'Services', icon: Building2 },
  { id: 'time', label: 'Time', icon: Clock, hidden: true },
  { id: 'scenario', label: 'Scenarios', icon: Route, hidden: true },
  { id: 'typology', label: 'Typology', icon: TrendingUp, hidden: true },
  { id: 'methodology', label: 'Method', icon: BookOpen, hidden: true },
];

/** What the navigation actually offers. Filtered once, so desktop and mobile cannot drift. */
export const VISIBLE_NAV_ITEMS = NAV_ITEMS.filter(item => !item.hidden);
