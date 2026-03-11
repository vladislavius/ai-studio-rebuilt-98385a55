import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, X, LogOut, Sun, Moon } from 'lucide-react';
import { MAIN_NAV, STATS_NAV, SETTINGS_NAV, TOOLS_NAV } from '@/constants/navigation';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { ViewMode } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface AppSidebarProps {
  currentView: ViewMode;
  selectedDept: string | null;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  isAdmin: boolean;
  onViewChange: (view: ViewMode) => void;
  onStatisticsView: (deptId: string | null) => void;
  onToggleSidebar: () => void;
  onCloseMobileMenu: () => void;
  onLogout: () => void;
}

export function AppSidebar({
  currentView,
  selectedDept,
  isSidebarCollapsed,
  isMobileMenuOpen,
  isAdmin,
  onViewChange,
  onStatisticsView,
  onToggleSidebar,
  onCloseMobileMenu,
  onLogout,
}: AppSidebarProps) {
  const { data: employees } = useEmployees();
  const { t } = useLabels();
  const { theme, toggleTheme } = useTheme();
  const employeeCount = employees?.length ?? 0;
  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-72';
  const sidebarMobileClasses = isMobileMenuOpen ? '' : '-translate-x-full md:translate-x-0';

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out md:relative ${sidebarWidth} ${sidebarMobileClasses}`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between h-[73px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-primary text-primary-foreground font-display font-bold text-sm">
            ОС
          </div>
          <div className={`transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden md:block' : 'opacity-100'}`}>
            <h1 className="font-display font-bold text-lg text-foreground whitespace-nowrap">Остров Сокровищ</h1>
            <span className={`text-xs font-display font-semibold px-2 py-0.5 rounded ${isAdmin ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isAdmin ? 'ADMIN' : 'USER'}
            </span>
          </div>
        </div>
        <button onClick={onCloseMobileMenu} className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg">
          <X size={20} />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden md:block p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors absolute right-[-12px] top-6 bg-card border border-border z-30"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 md:p-4 space-y-1 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mb-4 md:mb-6">
          {!isSidebarCollapsed && (
            <EditableLabel labelKey="nav.main" as="p" className="px-3 md:px-4 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3" />
          )}
          {MAIN_NAV.filter(item => !item.adminOnly || isAdmin).map(item => (
            <SidebarButton
              key={item.id}
              icon={<item.icon size={18} />}
              label={t(item.labelKey)}
              isActive={currentView === item.id}
              isCollapsed={isSidebarCollapsed}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </div>

        <div>
          {!isSidebarCollapsed && (
            <EditableLabel labelKey="nav.statistics" as="p" className="px-3 md:px-4 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3" />
          )}
          <SidebarButton
            icon={<STATS_NAV.icon size={18} />}
            label={t(STATS_NAV.labelKey)}
            isActive={currentView === 'statistics' && !selectedDept}
            isCollapsed={isSidebarCollapsed}
            onClick={() => onStatisticsView(null)}
            variant="highlight"
          />
          <DepartmentsList
            isCollapsed={isSidebarCollapsed}
            currentView={currentView}
            selectedDept={selectedDept}
            onSelectDept={onStatisticsView}
          />
        </div>

        <div className="mt-4 md:mt-6 border-t border-sidebar-border pt-3 md:pt-4">
          {!isSidebarCollapsed && (
            <EditableLabel labelKey="nav.tools" as="p" className="px-3 md:px-4 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3" />
          )}
          {TOOLS_NAV.map(item => (
            <SidebarButton
              key={item.id}
              icon={<item.icon size={18} />}
              label={t(item.labelKey)}
              isActive={currentView === item.id}
              isCollapsed={isSidebarCollapsed}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="mt-4 md:mt-6 border-t border-sidebar-border pt-3 md:pt-4">
            {!isSidebarCollapsed && (
              <EditableLabel labelKey="nav.config" as="p" className="px-3 md:px-4 text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3" />
            )}
            <SidebarButton
              icon={<SETTINGS_NAV.icon size={18} />}
              label={t(SETTINGS_NAV.labelKey)}
              isActive={currentView === 'settings'}
              isCollapsed={isSidebarCollapsed}
              onClick={() => onViewChange('settings')}
            />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-sidebar-border space-y-3">
        {!isSidebarCollapsed && isAdmin && (
          <div className="bg-accent rounded-xl p-3 md:p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1 font-display font-medium">{t('nav.employees_count')}</p>
            <p className="text-2xl font-display font-bold text-foreground">{employeeCount}</p>
          </div>
        )}
        <div className={`flex gap-2 ${isSidebarCollapsed ? 'flex-col' : 'flex-row'}`}>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent font-display font-medium transition-colors text-sm"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!isSidebarCollapsed && <span>{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-display font-medium transition-colors text-sm"
            title={t('nav.logout')}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarButton({
  icon, label, isActive, isCollapsed, onClick, variant,
}: {
  icon: React.ReactNode; label: string; isActive: boolean; isCollapsed: boolean; onClick: () => void; variant?: 'highlight';
}) {
  const activeClass = variant === 'highlight' && isActive
    ? 'bg-primary text-primary-foreground font-semibold'
    : isActive
    ? 'bg-accent text-primary font-semibold'
    : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground';

  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-2.5 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all font-display text-sm ${activeClass}`}
      title={isCollapsed ? label : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-tubelight"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        >
          <div className="w-[2px] h-6 bg-primary rounded-full" />
          <div className="absolute w-3 h-8 bg-primary/20 blur-md rounded-full" />
        </motion.div>
      )}
      <div className="flex-shrink-0">{icon}</div>
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function DepartmentsList({
  isCollapsed, currentView, selectedDept, onSelectDept,
}: {
  isCollapsed: boolean; currentView: ViewMode; selectedDept: string | null; onSelectDept: (deptId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: departments } = useDepartments();
  const { t } = useLabels();

  if (isCollapsed) return null;

  const topLevelDepts = (departments ?? [])
    .filter(d => !d.parent_id)
    .sort((a, b) => {
      const order = ['7', '1', '2', '3', '4', '5', '6'];
      const aIdx = order.indexOf(a.code.replace(/\D/g, '').charAt(0));
      const bIdx = order.indexOf(b.code.replace(/\D/g, '').charAt(0));
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2.5 px-3 md:px-4 py-2 rounded-lg text-sm transition-all text-sidebar-foreground hover:bg-accent font-display font-medium"
      >
        <div className="flex-shrink-0">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className="whitespace-nowrap">{t('nav.departments')}</span>
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-0.5 pl-2">
          {topLevelDepts.map(dept => {
            const isActive = currentView === 'statistics' && selectedDept === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => onSelectDept(dept.id)}
                className={`w-full flex items-center gap-2.5 px-3 md:px-4 py-1.5 rounded-lg transition-all ${
                  isActive ? 'bg-accent text-primary font-semibold' : 'text-muted-foreground hover:bg-accent font-medium'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color ?? '#4C5CFF' }} />
                <span className="truncate text-xs font-display">{dept.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
