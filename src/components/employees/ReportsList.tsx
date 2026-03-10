import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { BarChart3, FileText } from 'lucide-react';

export function ReportsList() {
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('report_templates').select('*');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const items = reports ?? [];
  const tmplMap = new Map((templates ?? []).map(t => [t.id, t]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
          <BarChart3 size={20} className="mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-foreground">{items.length}</p>
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Отчётов</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
          <FileText size={20} className="mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-foreground">{(templates ?? []).length}</p>
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Шаблонов</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Нет отчётов</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Отчёты создаются на основе шаблонов</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(r => {
            const emp = employees?.find(e => e.id === r.employee_id);
            const dept = departments?.find(d => d.id === r.department_id);
            const tmpl = r.template_id ? tmplMap.get(r.template_id) : null;
            return (
              <div key={r.id} className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm">{tmpl?.name ?? 'Отчёт'}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {emp?.full_name ?? ''} {dept ? `• ${dept.name}` : ''}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-body flex-shrink-0">
                  {new Date(r.period_start).toLocaleDateString('ru-RU')} — {new Date(r.period_end).toLocaleDateString('ru-RU')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
