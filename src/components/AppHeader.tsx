import { useState } from 'react';
import { Menu, Search, Plus, TrendingUp, Shield } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationsPanel } from '@/components/NotificationsPanel';

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
  const { t } = useLabels();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <header className="bg-card sticky top-0 z-20 border-b border-border px-4 md:px-8 py-4 flex justify-between items-center h-[73px]">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors flex-shrink-0"
            aria-label="Открыть меню"
          >
            <Menu size={24} />
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="relative w-full max-w-xs md:max-w-md flex items-center gap-2 pl-9 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:bg-accent transition-all font-body text-left"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <span className="flex-1">{t('header.search')}</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {isAdmin && (
            <div className="hidden md:flex items-center gap-1 bg-accent p-1 rounded-xl border border-border ml-4">
              <button
                onClick={onAddEmployee}
                className="px-3 py-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-primary hover:bg-card rounded-lg transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> <span>{t('header.add_employee')}</span>
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={onStatisticsView}
                className="px-3 py-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all flex items-center gap-1.5"
              >
                <TrendingUp size={14} /> <span>{t('header.dashboard')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationsPanel />

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-display font-semibold text-foreground">{userEmail || 'admin@company.com'}</p>
              <p className="text-[10px] text-muted-foreground font-body">{t('header.session')}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/20 text-primary border-2 border-card">
              <Shield size={16} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
