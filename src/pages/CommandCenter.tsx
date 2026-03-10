import { Users, TrendingUp, GraduationCap, Cake, BarChart3, FileText, UserCheck, Plus, Network } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommandCenterProps {
  isAdmin: boolean;
  onNavigate?: (view: string) => void;
}

export function CommandCenterPage({ isAdmin, onNavigate }: CommandCenterProps) {
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

  const { data: candidateCount } = useQuery({
    queryKey: ['candidate-count'],
    queryFn: async () => {
      const { count } = await supabase.from('candidates').select('*', { count: 'exact', head: true }).neq('status', 'converted');
      return count ?? 0;
    },
  });

  const { data: onboardingCount } = useQuery({
    queryKey: ['onboarding-active-count'],
    queryFn: async () => {
      const { count } = await supabase.from('onboarding_instances').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
      return count ?? 0;
    },
  });

  const employeeCount = employees?.length ?? 0;
  const deptCount = departments?.filter(d => !d.parent_id).length ?? 0;

  const today = new Date();
  const birthdaysThisMonth = (employees ?? []).filter(e => {
    if (!e.birth_date) return false;
    return new Date(e.birth_date).getMonth() === today.getMonth();
  }).length;

  const cards = [
    { icon: Users, label: 'Сотрудников', value: employeeCount, color: 'text-secondary', onClick: () => onNavigate?.('employees') },
    { icon: Network, label: 'Департаментов', value: deptCount, color: 'text-primary', onClick: () => onNavigate?.('org_chart') },
    { icon: TrendingUp, label: 'Статистик', value: statCount ?? 0, color: 'text-primary', onClick: () => onNavigate?.('statistics') },
    { icon: Cake, label: 'ДР в этом месяце', value: birthdaysThisMonth, color: 'text-secondary', onClick: () => onNavigate?.('employees_birthdays') },
  ];

  const quickActions = [
    { icon: BarChart3, label: 'Дашборд ОС', desc: `${statCount ?? 0} статистик отслеживается`, onClick: () => onNavigate?.('statistics') },
    { icon: UserCheck, label: 'Онбординг', desc: `${onboardingCount ?? 0} активных планов`, onClick: () => onNavigate?.('employees_onboarding') },
    { icon: Users, label: 'Кандидаты', desc: `${candidateCount ?? 0} в работе`, onClick: () => onNavigate?.('employees_candidates') },
    { icon: GraduationCap, label: 'Академия', desc: `${courseCount ?? 0} курсов доступно`, onClick: () => onNavigate?.('academy') },
  ];

  const recentEmployees = (employees ?? [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Пункт управления</h1>
          <p className="text-sm text-muted-foreground font-body">Обзор ключевых метрик и быстрые действия</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => onNavigate?.('employees_add')}
            className="px-4 py-2 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Добавить сотрудника</span>
          </button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.label}
            onClick={card.onClick}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group cursor-pointer"
          >
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
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
            {recentEmployees.map(emp => {
              const dept = departments?.find(d => (emp.department_ids ?? []).includes(d.id));
              return (
                <div
                  key={emp.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/20 cursor-pointer transition-colors"
                  onClick={() => onNavigate?.(`employee_${emp.id}`)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: dept?.color ?? 'hsl(var(--accent))' }}>
                    <span className="text-xs font-display font-bold text-primary-foreground">
                      {emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground text-sm truncate">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground font-body">{emp.position} {dept ? `• ${dept.name}` : ''}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    {new Date(emp.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
