import { useState } from 'react';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Search, Trash2, Phone, Mail, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CyberneticCard } from '@/components/ui/cybernetic-card';

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
          <option value="all">ВСЕ ДЕПАРТАМЕНТЫ</option>
          {departments?.filter(d => !d.parent_id).map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-display font-medium uppercase tracking-wider">
          Всего: {filtered.length}
        </p>
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          {employees?.length === 0 ? 'Нет сотрудников. Добавьте первого!' : 'Ничего не найдено'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => {
            const empDepts = (emp.department_ids ?? []).map(id => deptMap.get(id)).filter(Boolean);
            const empSubDepts = (emp.subdepartment_ids ?? []).map(id => deptMap.get(id)).filter(Boolean);
            const initials = emp.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const mainDept = empDepts[0];
            const mainSubDept = empSubDepts[0];

            return (
              <CyberneticCard
                key={emp.id}
                glowColor={mainDept?.color ?? 'hsl(var(--primary))'}
                onClick={() => onEdit(emp.id)}
              >
                {/* Color bar top */}
                <div className="h-1.5 w-full" style={{ backgroundColor: mainDept?.color ?? 'hsl(var(--muted))' }} />

                {/* Delete button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm('Удалить сотрудника?')) deleteMut.mutate(emp.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive z-10"
                >
                  <Trash2 size={14} />
                </button>

                <div className="p-4 space-y-3">
                  {/* Avatar + Badge */}
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt={emp.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center border-2 border-border">
                          <span className="text-base font-display font-bold text-foreground">{initials}</span>
                        </div>
                      )}
                      {mainDept && (
                        <span
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-card"
                          style={{ backgroundColor: mainDept.color ?? 'hsl(var(--muted))' }}
                        >
                          {mainDept.code?.replace(/[^\d]/g, '') || mainDept.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-sm text-foreground leading-tight truncate">{emp.full_name}</h3>
                      <p className="text-xs font-display font-medium mt-0.5 truncate" style={{ color: mainDept?.color ?? 'hsl(var(--muted-foreground))' }}>
                        {emp.position}
                      </p>
                    </div>
                  </div>

                  {/* Nickname + Dept info */}
                  <div className="space-y-1 text-xs text-muted-foreground font-body">
                    {emp.nickname && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-foreground/60">◆</span>
                        <span>{emp.nickname}</span>
                      </p>
                    )}
                    {mainSubDept && (
                      <p className="truncate">
                        {mainSubDept.name}
                      </p>
                    )}
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1.5 pt-1 border-t border-border">
                    {emp.phone && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Phone size={12} className="flex-shrink-0" />
                        <span className="truncate">{emp.phone}</span>
                      </p>
                    )}
                    {emp.email && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Mail size={12} className="flex-shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </p>
                    )}
                    {emp.telegram_username && (
                      <p className="flex items-center gap-2 text-xs font-body" style={{ color: mainDept?.color ?? 'hsl(var(--primary))' }}>
                        <MessageCircle size={12} className="flex-shrink-0" />
                        <span className="truncate">@{emp.telegram_username.replace('@', '')}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CyberneticCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
