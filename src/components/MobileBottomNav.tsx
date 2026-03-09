import { motion } from 'framer-motion';
import { ViewMode } from '@/types';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isAdmin: boolean;
}

const MOBILE_TABS: { id: ViewMode; icon: string; label: string; adminOnly?: boolean }[] = [
  { id: 'command_center', icon: 'Home', label: 'Главная' },
  { id: 'org_chart', icon: 'Network', label: 'Оргсхема' },
  { id: 'employees', icon: 'LayoutGrid', label: 'Персонал', adminOnly: true },
  { id: 'academy', icon: 'GraduationCap', label: 'Академия' },
  { id: 'statistics', icon: 'TrendingUp', label: 'Статистика' },
];

// Inline simple icons to avoid large import
import { Home, Network, LayoutGrid, GraduationCap, TrendingUp } from 'lucide-react';
const ICONS: Record<string, React.ElementType> = { Home, Network, LayoutGrid, GraduationCap, TrendingUp };

export function MobileBottomNav({ currentView, onViewChange, isAdmin }: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_TABS.filter(t => !t.adminOnly || isAdmin).map(tab => {
          const isActive = currentView === tab.id;
          const Icon = ICONS[tab.icon];
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tubelight"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                >
                  <div className="w-8 h-[2px] bg-primary rounded-full" />
                  <div className="w-12 h-3 bg-primary/20 blur-md rounded-full -mt-1" />
                </motion.div>
              )}
              <Icon size={20} />
              <span className="text-[10px] font-display font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
