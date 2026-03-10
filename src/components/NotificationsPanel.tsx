import { useState } from 'react';
import { Bell, Cake, ClipboardCheck, CheckCircle2, XCircle, X } from 'lucide-react';
import { useNotifications, type NotificationType } from '@/hooks/useNotifications';

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const { notifications, count } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-display font-bold text-foreground">Уведомления</p>
              <button onClick={() => setOpen(false)} aria-label="Закрыть уведомления" className="p-1 rounded hover:bg-accent text-muted-foreground">
                <X size={14} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground font-body">
                Нет новых уведомлений
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-80 overflow-y-auto">
                {notifications.map(n => (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === 'birthday' && n.daysLeft === 0 ? 'bg-primary/20 text-primary' :
                      n.type === 'birthday' ? 'bg-muted text-muted-foreground' :
                      n.type === 'checkout_pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      n.type === 'checkout_approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {n.type === 'birthday' && <Cake size={14} />}
                      {n.type === 'checkout_pending' && <ClipboardCheck size={14} />}
                      {n.type === 'checkout_approved' && <CheckCircle2 size={14} />}
                      {n.type === 'checkout_rejected' && <XCircle size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-display font-semibold text-foreground truncate">{n.title}</p>
                      <p className={`text-xs font-body mt-0.5 ${
                        n.daysLeft === 0 && n.type === 'birthday' ? 'text-primary font-semibold' :
                        n.type === 'checkout_approved' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
                        n.type === 'checkout_rejected' ? 'text-destructive font-semibold' :
                        n.type === 'checkout_pending' ? 'text-amber-600 dark:text-amber-400' :
                        'text-muted-foreground'
                      }`}>
                        {n.subtitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
