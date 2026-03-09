import { useState, useEffect } from 'react';
import { useCreateEmployee, useUpdateEmployee, useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface EmployeeFormProps {
  employeeId?: string | null;
  onClose: () => void;
}

export function EmployeeForm({ employeeId, onClose }: EmployeeFormProps) {
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();

  const existing = employeeId ? employees?.find(e => e.id === employeeId) : null;

  const [form, setForm] = useState({
    full_name: '',
    position: 'Сотрудник',
    email: '',
    phone: '',
    telegram: '',
    birth_date: '',
    join_date: '',
    department_ids: [] as string[],
  });

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name,
        position: existing.position,
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        telegram: existing.telegram ?? '',
        birth_date: existing.birth_date ?? '',
        join_date: existing.join_date ?? '',
        department_ids: existing.department_ids ?? [],
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      telegram: form.telegram || null,
      birth_date: form.birth_date || null,
      join_date: form.join_date || null,
      department_ids: form.department_ids.length > 0 ? form.department_ids : null,
    };

    if (employeeId && existing) {
      await updateMut.mutateAsync({ id: employeeId, updates: payload });
    } else {
      await createMut.mutateAsync(payload as any);
    }
    onClose();
  };

  const toggleDept = (id: string) => {
    setForm(prev => ({
      ...prev,
      department_ids: prev.department_ids.includes(id)
        ? prev.department_ids.filter(d => d !== id)
        : [...prev.department_ids, id],
    }));
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-foreground">
            {employeeId ? 'Редактировать' : 'Новый сотрудник'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">ФИО *</label>
            <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required className="bg-accent" />
          </div>

          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Должность</label>
            <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="bg-accent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-accent" />
            </div>
            <div>
              <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Телефон</label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-accent" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Telegram</label>
            <Input value={form.telegram} onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))} className="bg-accent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Дата рождения</label>
              <Input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} className="bg-accent" />
            </div>
            <div>
              <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Дата приёма</label>
              <Input type="date" value={form.join_date} onChange={e => setForm(p => ({ ...p, join_date: e.target.value }))} className="bg-accent" />
            </div>
          </div>

          {/* Department selection */}
          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground uppercase tracking-wider mb-2">Отделы</label>
            <div className="flex flex-wrap gap-2">
              {departments?.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDept(d.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-display font-medium transition-all border ${
                    form.department_ids.includes(d.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: d.color ?? undefined }} />
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-display font-medium text-muted-foreground hover:bg-accent transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={isLoading || !form.full_name} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
              {isLoading ? 'Сохранение...' : employeeId ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
