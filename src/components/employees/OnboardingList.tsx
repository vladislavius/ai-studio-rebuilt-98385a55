import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/hooks/useEmployees';
import { UserCheck, Clock, CheckCircle2 } from 'lucide-react';

export function OnboardingList() {
  const { data: employees } = useEmployees();
  const { data: instances, isLoading } = useQuery({
    queryKey: ['onboarding-instances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('onboarding_instances').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const items = instances ?? [];
  const active = items.filter(i => i.status === 'in_progress');
  const completed = items.filter(i => i.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, label: 'В процессе', value: active.length, color: 'text-amber-500' },
          { icon: CheckCircle2, label: 'Завершено', value: completed.length, color: 'text-emerald-500' },
          { icon: UserCheck, label: 'Всего', value: items.length, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="bg-muted/50 border border-border rounded-xl p-4 text-center">
            <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Нет активных планов онбординга</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Планы создаются при добавлении сотрудника через мастер</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(inst => {
            const emp = employees?.find(e => e.id === inst.employee_id);
            return (
              <div key={inst.id} className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <UserCheck size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm">{emp?.full_name ?? 'Сотрудник'}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Начало: {new Date(inst.start_date).toLocaleDateString('ru-RU')}
                    {inst.target_completion_date && ` • До: ${new Date(inst.target_completion_date).toLocaleDateString('ru-RU')}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${inst.progress_percentage ?? 0}%` }} />
                  </div>
                  <p className="text-[10px] font-display font-bold text-muted-foreground">{inst.progress_percentage ?? 0}%</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-display font-bold ${inst.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                  {inst.status === 'in_progress' ? 'В процессе' : 'Завершён'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
