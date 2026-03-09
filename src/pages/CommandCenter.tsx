import { Users, TrendingUp, GraduationCap, Cake, BarChart3, FileText, UserCheck } from 'lucide-react';

interface CommandCenterProps {
  isAdmin: boolean;
  employeeCount: number;
}

export function CommandCenterPage({ isAdmin, employeeCount }: CommandCenterProps) {
  const cards = [
    { icon: Users, label: 'Сотрудников', value: employeeCount, color: 'text-secondary' },
    { icon: TrendingUp, label: 'Статистик', value: 42, color: 'text-primary' },
    { icon: GraduationCap, label: 'Курсов', value: 8, color: 'text-primary' },
    { icon: Cake, label: 'Дней рождения', value: 3, color: 'text-secondary' },
  ];

  const quickActions = [
    { icon: BarChart3, label: 'Отчёты', desc: 'Сводка по отчётам за неделю' },
    { icon: UserCheck, label: 'Онбординг', desc: 'Активные планы адаптации' },
    { icon: FileText, label: 'Документы', desc: 'Ожидают подписания' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Пункт управления</h1>
        <p className="text-sm text-muted-foreground font-body">Обзор ключевых метрик и быстрые действия</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className={`${card.color} group-hover:scale-110 transition-transform`} />
            </div>
            <p className="text-3xl font-display font-bold text-foreground mb-1">{card.value}</p>
            <p className="text-xs font-display font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      {isAdmin && (
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(action => (
              <button
                key={action.label}
                className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:bg-accent/50 transition-all group"
              >
                <action.icon size={20} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-display font-semibold text-foreground mb-1">{action.label}</p>
                <p className="text-xs text-muted-foreground font-body">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Последние события</h2>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground font-body text-sm">События будут отображаться после подключения базы данных</p>
        </div>
      </div>
    </div>
  );
}
