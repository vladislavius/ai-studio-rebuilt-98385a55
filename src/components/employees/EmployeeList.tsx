import { useState } from 'react';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Search, Trash2, Edit, Phone, Mail, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EmployeeListProps {
  onEdit: (id: string) => void;
}

export function EmployeeList({ onEdit }: EmployeeListProps) {
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const deleteMut = useDeleteEmployee();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');

  const deptMap = new Map(departments?.map(d => [d.id, d]) ?? []);

  const filtered = (employees ?? []).filter(emp => {
    const matchSearch = !search || emp.full_name.toLowerCase().includes(search.toLowerCase()) || emp.position.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || (emp.department_ids ?? []).includes(filterDept);
    return matchSearch && matchDept;
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground font-body text-sm">Загрузка сотрудников...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или должности..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-accent border-border"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 bg-accent border border-border rounded-lg text-sm font-body text-foreground"
        >
          <option value="all">Все отделы</option>
          {departments?.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground font-display font-medium">
        Найдено: {filtered.length}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          {employees?.length === 0 ? 'Нет сотрудников. Добавьте первого!' : 'Ничего не найдено'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => {
            const empDepts = (emp.department_ids ?? []).map(id => deptMap.get(id)).filter(Boolean);
            return (
              <div
                key={emp.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors group cursor-pointer"
                onClick={() => onEdit(emp.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-display font-bold text-foreground">
                        {emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-foreground text-sm truncate">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground font-body truncate">{emp.position}</p>
                      {empDepts.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {empDepts.map(d => (
                            <span key={d!.id} className="text-[10px] px-1.5 py-0.5 rounded font-display font-medium" style={{ backgroundColor: `${d!.color}20`, color: d!.color ?? undefined }}>
                              {d!.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {emp.phone && <Phone size={14} className="text-muted-foreground" />}
                    {emp.email && <Mail size={14} className="text-muted-foreground" />}
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(emp.id); }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Удалить сотрудника?')) deleteMut.mutate(emp.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
