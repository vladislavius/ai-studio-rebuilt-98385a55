import { Users, TrendingUp, GraduationCap, Cake, BarChart3, FileText, UserCheck } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommandCenterProps {
  isAdmin: boolean;
}

export function CommandCenterPage({ isAdmin }: CommandCenterProps) {
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const { data: statCount } = useQuery({
    queryKey: ['stat-count'],
    queryFn: async () => {
      const { count } = await supabase.from('statistic_definitions').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: courseCount } = useQuery({
    queryKey: ['course-count'],
    queryFn: async () => {
      const { count } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const employeeCount = employees?.length ?? 0;

  // Birthdays this month
  const today = new Date();
  const birthdaysThisMonth = (employees ?? []).filter(e => {
    if (!e.birth_date) return false;
    return new Date(e.birth_date).getMonth() === today.getMonth();
  }).length;

  const cards = [
    { icon: Users, label: 'Сотрудников', value: employeeCount, color: 'text-secondary' },
    { icon: TrendingUp, label: 'Статистик', value: statCount ?? 0, color: 'text-primary' },
    { icon: GraduationCap, label: 'Курсов', value: courseCount ?? 0, color: 'text-primary' },
    { icon: Cake, label: 'ДР в этом месяце', value: birthdaysThisMonth, color: 'text-secondary' },
  ];

  const quickActions = [
    { icon: BarChart3, label: 'Отчёты', desc: 'Сводка по отчётам за неделю' },
    { icon: UserCheck, label: 'Онбординг', desc: 'Активные планы адаптации' },
    { icon: FileText, label: 'Документы', desc: 'Ожидают подписания' },
  ];

  // Recent employees
  const recentEmployees = (employees ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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

      {/* Recent employees */}
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Последние добавленные</h2>
        {recentEmployees.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground font-body text-sm">Пока нет сотрудников</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEmployees.map(emp => (
              <div key={emp.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-display font-bold text-foreground">
                    {emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm truncate">{emp.full_name}</p>
                  <p className="text-xs text-muted-foreground font-body">{emp.position}</p>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  {new Date(emp.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
