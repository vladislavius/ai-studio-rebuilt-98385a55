import { useState } from 'react';
import { useDepartments, DBDepartment } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCompanySettings } from '@/hooks/useOrgChartMutations';
import { useAuth } from '@/hooks/useAuth';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';
import { Users, Plus, Settings, Pencil } from 'lucide-react';
import { CyberneticCard } from '@/components/ui/cybernetic-card';
import { DepartmentDetailPanel } from '@/components/orgchart/DepartmentDetailPanel';
import { DepartmentEditModal } from '@/components/orgchart/DepartmentEditModal';
import { CreateDepartmentModal } from '@/components/orgchart/CreateDepartmentModal';
import { CompanySettingsModal } from '@/components/orgchart/CompanySettingsModal';
import { Button } from '@/components/ui/button';

export function OrgChartPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees();
  const { data: settings } = useCompanySettings();
  const { isAdmin } = useAuth();
  const { t } = useLabels();

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [editDept, setEditDept] = useState<DBDepartment | null>(null);
  const [createParent, setCreateParent] = useState<DBDepartment | null | undefined>(undefined);
  const [showCompanySettings, setShowCompanySettings] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">{t('org.loading')}</div>;

  const allDepts = departments ?? [];
  const emps = employees ?? [];
  const rootDepts = allDepts.filter(d => !d.parent_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const getChildren = (parentId: string) =>
    allDepts.filter(d => d.parent_id === parentId).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const getEmployeeCount = (deptId: string) =>
    emps.filter(e =>
      (e.department_ids ?? []).includes(deptId) ||
      (e.subdepartment_ids ?? []).includes(deptId)
    ).length;

  const getTotalEmployeeCount = (deptId: string) => {
    const children = getChildren(deptId);
    return getEmployeeCount(deptId) + children.reduce((sum, c) => sum + getEmployeeCount(c.id), 0);
  };

  const selectedDept = selectedDeptId ? allDepts.find(d => d.id === selectedDeptId) : null;

  const s = settings ?? {};

  return (
    <div className="space-y-6 relative">
      <div className="flex items-start justify-between">
        <div>
          <EditableLabel labelKey="org.title" as="h1" className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1" />
          <p className="text-sm text-muted-foreground font-body">
            {t('org.subtitle_prefix')} — {rootDepts.length} {t('org.departments')}, {allDepts.length - rootDepts.length} {t('org.divisions')}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCompanySettings(true)}>
              <Settings size={14} className="mr-1" /> {t('org.settings')}
            </Button>
            <Button size="sm" onClick={() => setCreateParent(null)}>
              <Plus size={14} className="mr-1" /> {t('org.add_dept')}
            </Button>
          </div>
        )}
      </div>

      {/* Founder & CEO */}
      <div className="flex flex-col items-center gap-0">
        <div
          className="bg-[#FFD700] border-2 border-[#DAA520] rounded-xl px-10 py-4 text-center relative shadow-lg group cursor-pointer"
          onClick={() => isAdmin && setShowCompanySettings(true)}
        >
          <p className="text-sm font-display font-bold text-gray-900">{s.founder_title ?? t('org.founder')}</p>
          <p className="text-xs font-body text-gray-700">{s.founder_subtitle ?? t('org.founder_subtitle')}</p>
          {isAdmin && (
            <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={12} className="text-foreground/50" />
            </span>
          )}
        </div>
        <div className="w-px h-6 bg-primary" />
        <div
          className="bg-primary/10 border-2 border-primary rounded-xl px-10 py-4 text-center shadow-lg group cursor-pointer"
          onClick={() => isAdmin && setShowCompanySettings(true)}
        >
          <p className="text-sm font-display font-bold text-foreground">{s.ceo_title ?? t('org.ceo')}</p>
          <p className="text-xs font-body text-foreground/70">{s.ceo_subtitle ?? t('org.ceo_subtitle')}</p>
          {isAdmin && (
            <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={12} className="text-foreground/50" />
            </span>
          )}
        </div>
        <div className="w-px h-6 bg-primary" />
      </div>

      {/* Horizontal connector */}
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
              onEdit={isAdmin ? (d) => setEditDept(d) : undefined}
              onAddChild={isAdmin ? (d) => setCreateParent(d) : undefined}
              isSelected={selectedDeptId === dept.id}
            />
          );
        })}
      </div>

      {/* Company Goal & VFP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <div
          className="bg-card border border-border rounded-xl p-6 text-center group cursor-pointer"
          onClick={() => isAdmin && setShowCompanySettings(true)}
        >
          <div className="text-2xl mb-2">🎯</div>
          <EditableLabel labelKey="org.company_goal" as="p" className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-3" />
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            {s.company_goal ?? '—'}
          </p>
        </div>
        <div
          className="bg-card border border-border rounded-xl p-6 text-center group cursor-pointer"
          onClick={() => isAdmin && setShowCompanySettings(true)}
        >
          <div className="text-2xl mb-2">👑</div>
          <EditableLabel labelKey="org.company_vfp" as="p" className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-3" />
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            {s.company_vfp ?? '—'}
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
          isAdmin={isAdmin}
          onEditDept={d => setEditDept(d)}
          onAddChild={d => setCreateParent(d)}
        />
      )}

      <DepartmentEditModal dept={editDept} open={!!editDept} onClose={() => setEditDept(null)} />
      <CreateDepartmentModal open={createParent !== undefined} onClose={() => setCreateParent(undefined)} parentDept={createParent ?? null} allDepts={allDepts} />
      <CompanySettingsModal open={showCompanySettings} onClose={() => setShowCompanySettings(false)} />
    </div>
  );
}

function DepartmentColumn({
  dept, children, totalEmps, getEmployeeCount, onSelect, onEdit, onAddChild, isSelected,
}: {
  dept: DBDepartment;
  children: DBDepartment[];
  totalEmps: number;
  getEmployeeCount: (id: string) => number;
  onSelect: (id: string) => void;
  onEdit?: (d: DBDepartment) => void;
  onAddChild?: (d: DBDepartment) => void;
  isSelected: boolean;
}) {
  const { t } = useLabels();

  return (
    <CyberneticCard
      glowColor={dept.color ?? 'hsl(var(--primary))'}
      className={isSelected ? 'border-primary shadow-lg shadow-primary/10' : ''}
      onClick={() => onSelect(dept.id)}
    >
      <div className="h-1" style={{ backgroundColor: dept.color ?? '#4C5CFF' }} />
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
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(dept); }}
                className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <Pencil size={10} className="text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-display">
              <Users size={11} />
              <span>{totalEmps}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body mb-3">
          <span className="text-foreground/60">•</span>
          <span>{dept.manager_name ?? '—'}</span>
        </div>

        {children.length > 0 && (
          <div className="space-y-2">
            {children.map(child => {
              const childEmps = getEmployeeCount(child.id);
              return (
                <div
                  key={child.id}
                  className="bg-muted/50 rounded-lg p-3 border border-border/50 group/child"
                  onClick={(e) => { e.stopPropagation(); onSelect(child.id); }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
                      DIV {child.sort_order}
                    </p>
                    {onEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(child); }}
                        className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover/child:opacity-100 transition-opacity hover:bg-muted"
                      >
                        <Pencil size={8} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-display font-semibold text-foreground mb-1">{child.full_name ?? child.name}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-body">
                    <span>👤 {child.manager_name ?? '—'}</span>
                    <span>{childEmps}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {children.length === 0 && (
          <div className="text-[10px] text-muted-foreground/50 font-body italic">{t('org.no_divisions')}</div>
        )}

        {onAddChild && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(dept); }}
            className="mt-2 w-full py-1.5 border border-dashed border-border rounded-lg text-[10px] text-muted-foreground font-display opacity-0 group-hover:opacity-100 transition-opacity hover:border-primary hover:text-primary flex items-center justify-center gap-1"
          >
            <Plus size={10} /> {t('org.add_division')}
          </button>
        )}
      </div>
    </CyberneticCard>
  );
}
