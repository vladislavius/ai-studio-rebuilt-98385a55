import { Home, Network, LayoutGrid, GraduationCap, TrendingUp } from 'lucide-react';
import { ViewMode } from '@/types';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isAdmin: boolean;
}

const MOBILE_TABS = [
  { id: 'command_center' as ViewMode, icon: Home, label: 'Главная' },
  { id: 'org_chart' as ViewMode, icon: Network, label: 'Оргсхема' },
  { id: 'employees' as ViewMode, icon: LayoutGrid, label: 'Персонал', adminOnly: true },
  { id: 'academy' as ViewMode, icon: GraduationCap, label: 'Академия' },
  { id: 'statistics' as ViewMode, icon: TrendingUp, label: 'Статистика' },
];

export function MobileBottomNav({ currentView, onViewChange, isAdmin }: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_TABS.filter(t => !t.adminOnly || isAdmin).map(tab => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-display font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
