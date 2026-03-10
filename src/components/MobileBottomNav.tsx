import { motion } from 'framer-motion';
import { ViewMode } from '@/types';
import { useLabels } from '@/hooks/useLabels';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isAdmin: boolean;
}

const MOBILE_TABS: { id: ViewMode; icon: string; labelKey: string; adminOnly?: boolean }[] = [
  { id: 'command_center', icon: 'Home', labelKey: 'mobile.home' },
  { id: 'org_chart', icon: 'Network', labelKey: 'mobile.org_chart' },
  { id: 'employees', icon: 'LayoutGrid', labelKey: 'mobile.employees', adminOnly: true },
  { id: 'academy', icon: 'GraduationCap', labelKey: 'mobile.academy' },
  { id: 'statistics', icon: 'TrendingUp', labelKey: 'mobile.statistics' },
];

import { Home, Network, LayoutGrid, GraduationCap, TrendingUp } from 'lucide-react';
const ICONS: Record<string, React.ElementType> = { Home, Network, LayoutGrid, GraduationCap, TrendingUp };

export function MobileBottomNav({ currentView, onViewChange, isAdmin }: MobileBottomNavProps) {
  const { t } = useLabels();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_TABS.filter(tab => !tab.adminOnly || isAdmin).map(tab => {
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
              <span className="text-[10px] font-display font-medium">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
