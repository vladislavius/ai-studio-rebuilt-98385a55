import { useState } from 'react';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Search, Trash2, Phone, Mail, MessageCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CyberneticCard } from '@/components/ui/cybernetic-card';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

interface EmployeeListProps {
  onEdit: (id: string) => void;
}

function EmployeeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="h-1.5 w-full bg-muted" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-1.5 pt-2 border-t border-border">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function EmployeeList({ onEdit }: EmployeeListProps) {
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const deleteMut = useDeleteEmployee();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [page, setPage] = useState(1);

  const deptMap = new Map(departments?.map(d => [d.id, d]) ?? []);

  const filtered = (employees ?? []).filter(emp => {
    const matchSearch = !search || emp.full_name.toLowerCase().includes(search.toLowerCase()) || emp.position.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || (emp.department_ids ?? []).includes(filterDept);
    return matchSearch && matchDept;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleDeptFilter = (value: string) => { setFilterDept(value); setPage(1); };

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error('Нет данных для экспорта'); return; }
    const headers = ['ФИО', 'Должность', 'Email', 'Телефон', 'Telegram', 'Департамент', 'Дата приёма', 'Дата рождения'];
    const rows = filtered.map(emp => {
      const dept = (emp.department_ids ?? []).map(id => deptMap.get(id)?.name).filter(Boolean).join('; ');
      return [
        emp.full_name,
        emp.position || '',
        emp.email || '',
        emp.phone || '',
        emp.telegram_username ? `@${emp.telegram_username.replace('@', '')}` : '',
        dept,
        emp.join_date || '',
        emp.birth_date || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = '\ufeff' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано ${filtered.length} сотрудников`);
  };

  return (
    <div className="space-y-4">
      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или должности..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 bg-accent border-border"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => handleDeptFilter(e.target.value)}
          className="px-3 py-2 bg-accent border border-border rounded-lg text-sm font-body text-foreground"
        >
          <option value="all">ВСЕ ДЕПАРТАМЕНТЫ</option>
          {departments?.filter(d => !d.parent_id).map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Count + Export */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-display font-medium uppercase tracking-wider">
          {isLoading ? <Skeleton className="h-3 w-20 inline-block" /> : `Всего: ${filtered.length}`}
        </p>
        {!isLoading && filtered.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-7 gap-1.5 text-xs">
            <Download size={12} />
            CSV
          </Button>
        )}
      </div>

      {/* Skeleton grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <EmployeeCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          {employees?.length === 0 ? 'Нет сотрудников. Добавьте первого!' : 'Ничего не найдено'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(emp => {
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
                        <p className="truncate">{mainSubDept.name}</p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-muted-foreground font-body">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
