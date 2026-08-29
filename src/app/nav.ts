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
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'services', label: 'Services', icon: Building2 },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'scenario', label: 'Scenarios', icon: Route },
  { id: 'typology', label: 'Typology', icon: TrendingUp },
  { id: 'methodology', label: 'Method', icon: BookOpen },
];
