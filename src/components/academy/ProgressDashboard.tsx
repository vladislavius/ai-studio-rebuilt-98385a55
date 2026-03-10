import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Award, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'certified';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Все',
  not_started: 'Не начат',
  in_progress: 'В процессе',
  completed: 'Завершён',
  certified: 'Сертифицирован',
};

export function ProgressDashboard() {
  const { isAdmin, isSupervisor } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const certifyMut = useMutation({
    mutationFn: async (progressId: string) => {
      const { error } = await supabase.from('course_progress').update({ certified: true }).eq('id', progressId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-course-progress'] });
      toast.success('Курс сертифицирован ✓');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: progress, isLoading } = useQuery({
    queryKey: ['all-course-progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_progress').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, position');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);
  const empMap = new Map(employees?.map(e => [e.id, e]) || []);
  const items = progress || [];

  const getStatus = (p: typeof items[0]): StatusFilter => {
    if (p.certified) return 'certified';
    if (p.completed_at) return 'completed';
    if ((p.progress_percent || 0) > 0) return 'in_progress';
    return 'not_started';
  };

  const filtered = filter === 'all' ? items : items.filter(p => getStatus(p) === filter);

  const stats = {
    total: items.length,
    inProgress: items.filter(p => getStatus(p) === 'in_progress').length,
    completed: items.filter(p => getStatus(p) === 'completed' || getStatus(p) === 'certified').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Всего назначений</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock size={10} /> В процессе</p>
          <p className="text-2xl font-display font-bold text-primary mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1"><Award size={10} /> Завершено</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key as StatusFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors ${filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertCircle size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет назначений</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Сотрудник</th>
                  <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Курс</th>
                  <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase w-40">Прогресс</th>
                  <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const emp = empMap.get(p.employee_id);
                  const status = getStatus(p);
                  const statusColors: Record<string, string> = {
                    not_started: 'bg-muted text-muted-foreground',
                    in_progress: 'bg-primary/10 text-primary',
                    completed: 'bg-primary/20 text-primary',
                    certified: 'bg-primary text-primary-foreground',
                  };
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="p-3">
                        <p className="font-body text-foreground">{emp?.full_name || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{emp?.position}</p>
                      </td>
                      <td className="p-3 font-body text-foreground">{courseMap.get(p.course_id) || '—'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress_percent || 0} className="h-1.5 flex-1" />
                          <span className="text-[10px] font-display font-bold text-muted-foreground w-8">{p.progress_percent || 0}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-display font-bold uppercase px-2 py-1 rounded ${statusColors[status]}`}>
                            {STATUS_LABELS[status]}
                          </span>
                          {(isAdmin || isSupervisor) && status === 'completed' && !p.certified && (
                            <button
                              onClick={() => certifyMut.mutate(p.id)}
                              disabled={certifyMut.isPending}
                              className="px-2 py-1 bg-primary text-primary-foreground rounded text-[10px] font-display font-bold flex items-center gap-1 hover:bg-primary/90 disabled:opacity-50"
                            >
                              <ShieldCheck size={12} /> Сертифицировать
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
