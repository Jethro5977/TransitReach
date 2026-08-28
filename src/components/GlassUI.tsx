import { useState, useEffect, type ReactNode } from 'react';
import { Navigation, X, type LucideIcon } from 'lucide-react';
import { useScrollPosition, useToasts, type Toast } from '@/hooks/useAnimations';

export type PageId = 'landing' | 'map' | 'services' | 'time' | 'scenario' | 'typology' | 'methodology';

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function NavBar({ items, activePage, onNavigate }: NavBarProps) {
  const scrollY = useScrollPosition();
  const scrolled = scrollY > 20;
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<PageId | null>(null);

  useEffect(() => {
    if (hoveredItem) {
      const el = document.querySelector(`[data-nav-id="${hoveredItem}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        if (parent) {
          setIndicatorStyle({ left: rect.left - parent.left, width: rect.width });
        }
      }
    } else {
      const el = document.querySelector(`[data-nav-id="${activePage}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        if (parent) {
          setIndicatorStyle({ left: rect.left - parent.left, width: rect.width });
        }
      }
    }
  }, [hoveredItem, activePage]);

  return (
    <nav className={`glass-nav fixed top-0 left-0 right-0 z-50 ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Navigation size={18} color="white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[15px] font-bold text-slate-900 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                TransitReach
              </div>
              <div className="text-[10px] text-slate-500 leading-tight font-medium tracking-wide uppercase">
                Mobility Accessibility
              </div>
            </div>
          </button>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-1 relative">
            {/* Sliding indicator */}
            {indicatorStyle && (
              <div
                className="absolute bottom-0 h-[3px] bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-200 ease-out"
                style={{
                  left: indicatorStyle.left + 8,
                  width: Math.max(indicatorStyle.width - 16, 0),
                }}
              />
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  data-nav-id={item.id}
                  onClick={() => onNavigate(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${
                    active
                      ? 'text-teal-700'
                      : 'text-slate-500 hover:text-teal-700'
                  }`}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <MobileNav items={items} activePage={activePage} onNavigate={onNavigate} />
        </div>
      </div>
    </nav>
  );
}

function MobileNav({ items, activePage, onNavigate }: { items: NavItem[]; activePage: PageId; onNavigate: (p: PageId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="btn-icon"
        aria-label="Menu"
      >
        <Navigation size={18} />
      </button>
      {open && (
        <div className="absolute top-16 right-4 glass-strong p-2 min-w-[200px] z-50 fade-slide-up">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} strokeWidth={2.2} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Toast Container ----
export function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass-strong px-4 py-3 flex items-center gap-3 toast-enter pointer-events-auto"
          style={{ borderRadius: 12 }}
        >
          {toast.icon && <span className="text-teal-600 font-bold">{toast.icon}</span>}
          <span className="text-sm font-semibold text-slate-700">{toast.message}</span>
          <button
            onClick={() => onClose(toast.id)}
            className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- Page Transition Wrapper ----
export function PageTransition({ children, pageKey }: { children: ReactNode; pageKey: string }) {
  return (
    <div key={pageKey} className="page-enter">
      {children}
    </div>
  );
}

// ---- Drawer ----
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: string;
}

export function Drawer({ open, onClose, children, title, width = '420px' }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="absolute top-0 right-0 bottom-0 glass-strong drawer-enter overflow-y-auto scrollbar-thin"
        style={{ width, maxWidth: '100vw' }}
      >
        {title && (
          <div className="sticky top-0 glass-strong px-6 py-4 flex items-center justify-between border-b border-slate-200/50 z-10">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="btn-icon" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- Modal ----
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm fade-in" onClick={onClose} />
      <div
        className="relative glass-strong p-6 max-w-md w-full fade-slide-up"
        style={{ animation: 'pageEnter 300ms ease-out, fadeIn 300ms ease-out' }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- Tooltip (HTML-based, positioned) ----
interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900/92 text-white text-xs font-semibold whitespace-nowrap z-50 fade-in`}
          style={{ animationDuration: '150ms' }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
