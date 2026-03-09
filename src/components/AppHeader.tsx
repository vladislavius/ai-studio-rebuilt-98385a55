import { Menu, Search, Plus, TrendingUp, Bell, Shield } from 'lucide-react';

interface AppHeaderProps {
  isAdmin: boolean;
  userEmail?: string;
  onToggleMobileMenu: () => void;
  onAddEmployee: () => void;
  onStatisticsView: () => void;
}

export function AppHeader({
  isAdmin,
  userEmail,
  onToggleMobileMenu,
  onAddEmployee,
  onStatisticsView,
}: AppHeaderProps) {
  return (
    <header className="bg-card sticky top-0 z-20 border-b border-border px-4 md:px-8 py-4 flex justify-between items-center h-[73px]">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors flex-shrink-0"
          aria-label="Открыть меню"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="relative w-full max-w-xs md:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск сотрудников... ⌘K"
            className="w-full pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-body transition-all"
          />
        </div>

        {/* Quick actions */}
        {isAdmin && (
          <div className="hidden md:flex items-center gap-1 bg-accent p-1 rounded-xl border border-border ml-4">
            <button
              onClick={onAddEmployee}
              className="px-3 py-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-primary hover:bg-card rounded-lg transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> <span>Сотрудник</span>
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={onStatisticsView}
              className="px-3 py-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all flex items-center gap-1.5"
            >
              <TrendingUp size={14} /> <span>Дашборд ОС</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-display font-semibold text-foreground">{userEmail || 'admin@company.com'}</p>
            <p className="text-[10px] text-muted-foreground font-body">Текущая сессия</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/20 text-primary border-2 border-card">
            <Shield size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}
