import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { Network, Users, ChevronRight } from 'lucide-react';

export function OrgChartPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка оргсхемы...</div>;

  const depts = departments ?? [];
  const emps = employees ?? [];

  const getEmployeeCount = (deptId: string) =>
    emps.filter(e => (e.department_ids ?? []).includes(deptId)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Организационная структура</h1>
        <p className="text-sm text-muted-foreground font-body">Оргсхема «Остров Сокровищ» — {depts.length} отделений</p>
      </div>

      {/* Top-level overview */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Network size={24} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-foreground">Остров Сокровищ</h2>
          <p className="text-xs text-muted-foreground font-body">Всего сотрудников: {emps.length} • Отделов: {depts.length}</p>
        </div>
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {depts.map(dept => {
          const empCount = getEmployeeCount(dept.id);
          return (
            <div
              key={dept.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color ?? '#4C5CFF' }} />
                <h3 className="font-display font-semibold text-foreground text-sm">{dept.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-2">{dept.full_name}</p>
              <p className="text-xs text-muted-foreground font-body mb-3">{dept.description}</p>

              {dept.goal && (
                <div className="mb-3">
                  <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-wider">Цель</p>
                  <p className="text-xs font-body text-foreground mt-0.5">{dept.goal}</p>
                </div>
              )}

              {dept.vfp && (
                <div className="mb-3">
                  <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-wider">ЦКП</p>
                  <p className="text-xs font-body text-foreground mt-0.5">{dept.vfp}</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-wider">Руководитель</p>
                  <p className="text-xs font-body text-foreground mt-0.5">{dept.manager_name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-display">
                  <Users size={12} />
                  <span>{empCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
