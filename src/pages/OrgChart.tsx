import { Network } from 'lucide-react';
import { ORGANIZATION_STRUCTURE, DEPT_SORT_ORDER } from '@/constants';

export function OrgChartPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Организационная структура</h1>
        <p className="text-sm text-muted-foreground font-body">Оргсхема «Остров Сокровищ» — 7 отделений</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEPT_SORT_ORDER.map(deptId => {
          const dept = ORGANIZATION_STRUCTURE[deptId];
          if (!dept) return null;
          return (
            <div
              key={deptId}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                <h3 className="font-display font-semibold text-foreground text-sm">{dept.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-2">{dept.fullName}</p>
              <p className="text-xs text-muted-foreground font-body">{dept.description}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-wider">Руководитель</p>
                <p className="text-xs font-body text-foreground mt-0.5">{dept.manager}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
