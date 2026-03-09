import { useState } from 'react';
import { useDepartments, DBDepartment } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { Crown, Users, ChevronRight } from 'lucide-react';
import { DepartmentDetailPanel } from '@/components/orgchart/DepartmentDetailPanel';

export function OrgChartPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка оргсхемы...</div>;

  const allDepts = departments ?? [];
  const emps = employees ?? [];

  // Root departments (no parent)
  const rootDepts = allDepts.filter(d => !d.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // Subdivisions grouped by parent
  const getChildren = (parentId: string) =>
    allDepts.filter(d => d.parent_id === parentId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const getEmployeeCount = (deptId: string) =>
    emps.filter(e => (e.department_ids ?? []).includes(deptId)).length;

  const getTotalEmployeeCount = (deptId: string) => {
    const children = getChildren(deptId);
    const directCount = getEmployeeCount(deptId);
    const childCount = children.reduce((sum, c) => sum + getEmployeeCount(c.id), 0);
    return directCount + childCount;
  };

  const selectedDept = selectedDeptId ? allDepts.find(d => d.id === selectedDeptId) : null;

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Организационная структура компании</h1>
        <p className="text-sm text-muted-foreground font-body">Оргсхема «Остров Сокровищ» — {rootDepts.length} департаментов, {allDepts.length - rootDepts.length} отделов</p>
      </div>

      {/* Founder & Executive Director */}
      <div className="flex flex-col items-center gap-0">
        <div className="bg-[#FFD700] border-2 border-[#DAA520] rounded-xl px-10 py-4 text-center relative shadow-lg">
          <p className="text-sm font-display font-bold text-foreground">Основатель</p>
          <p className="text-xs font-body text-foreground/70">Стратегическое руководство</p>
        </div>
        <div className="w-px h-6 bg-primary" />
        <div className="bg-primary/10 border-2 border-primary rounded-xl px-10 py-4 text-center shadow-lg">
          <p className="text-sm font-display font-bold text-foreground">Генеральный директор</p>
          <p className="text-xs font-body text-foreground/70">Операционное управление</p>
        </div>
        <div className="w-px h-6 bg-primary" />
      </div>

      {/* Horizontal connector line */}
      <div className="relative mx-4">
        <div className="absolute top-0 left-[calc(100%/14)] right-[calc(100%/14)] h-px bg-border" />
      </div>

      {/* Department columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {rootDepts.map(dept => {
          const children = getChildren(dept.id);
          const totalEmps = getTotalEmployeeCount(dept.id);
          return (
            <DepartmentColumn
              key={dept.id}
              dept={dept}
              children={children}
              totalEmps={totalEmps}
              getEmployeeCount={getEmployeeCount}
              onSelect={(id) => setSelectedDeptId(id)}
              isSelected={selectedDeptId === dept.id}
            />
          );
        })}
      </div>

      {/* Company Goal & VFP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-3">Цель Компании</p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            Быть лидером туристического рынка Таиланда. Стать ведущей международной компанией в сфере организации
            незабываемых и интересных экскурсий, обеспечивая нашим туристам яркие впечатления и долгие воспоминания.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-2xl mb-2">👑</div>
          <p className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-3">ЦКП Компании</p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            Восторженные туристы, получившие незабываемые впечатления от интересных экскурсий, с радостью рекомендуют нас
            другим и снова обращаются за нашими услугами.
          </p>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDept && (
        <DepartmentDetailPanel
          dept={selectedDept}
          allDepts={allDepts}
          employees={emps}
          onClose={() => setSelectedDeptId(null)}
        />
      )}
    </div>
  );
}

function DepartmentColumn({
  dept,
  children,
  totalEmps,
  getEmployeeCount,
  onSelect,
  isSelected,
}: {
  dept: DBDepartment;
  children: DBDepartment[];
  totalEmps: number;
  getEmployeeCount: (id: string) => number;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/30'
      } bg-card overflow-hidden`}
      onClick={() => onSelect(dept.id)}
    >
      {/* Color top bar */}
      <div className="h-1" style={{ backgroundColor: dept.color ?? '#4C5CFF' }} />

      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-display font-bold text-card"
              style={{ backgroundColor: dept.color ?? 'hsl(var(--primary))' }}
            >
              {dept.sort_order === 0 ? '7' : dept.sort_order}
            </span>
            <h3 className="text-sm font-display font-bold text-foreground">{dept.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-display">
            <Users size={11} />
            <span>{totalEmps}</span>
          </div>
        </div>

        {/* Manager */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mb-3">
          <span className="text-foreground/60">•</span>
          <span>{dept.manager_name ?? '—'}</span>
        </div>

        {/* Subdivisions */}
        {children.length > 0 && (
          <div className="space-y-2">
            {children.map(child => {
              const childEmps = getEmployeeCount(child.id);
              return (
                <div
                  key={child.id}
                  className="bg-muted/50 rounded-lg p-3 border border-border/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(child.id);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
                      DIV {child.sort_order}
                    </p>
                    {/* no extra here */}
                  </div>
                  <p className="text-xs font-display font-semibold text-foreground mb-1">{child.name}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-body">
                    <span>• {child.manager_name ?? '—'}</span>
                    <span>{childEmps}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {children.length === 0 && (
          <div className="text-[10px] text-muted-foreground/50 font-body italic">Нет подразделений</div>
        )}
      </div>
    </div>
  );
}
