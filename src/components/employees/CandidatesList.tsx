import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartments } from '@/hooks/useDepartments';
import { Plus, Search, UserPlus, Trash2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function CandidatesList() {
  const qc = useQueryClient();
  const { data: departments } = useDepartments();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', position: '', department_id: '', phone: '', email: '', notes: '' });

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (c: typeof form) => {
      const { error } = await supabase.from('candidates').insert([{
        first_name: c.first_name,
        last_name: c.last_name,
        position: c.position || 'Кандидат',
        department_id: c.department_id || null,
        phone: c.phone || null,
        email: c.email || null,
        notes: c.notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Кандидат добавлен'); setShowForm(false); setForm({ first_name: '', last_name: '', position: '', department_id: '', phone: '', email: '', notes: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Кандидат удалён'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (candidates ?? []).filter(c =>
    !search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const topDepts = departments?.filter(d => !d.parent_id) ?? [];

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Поиск кандидатов..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-accent" />
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm">
          <Plus size={16} /> Добавить кандидата
        </button>
      </div>

      {showForm && (
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
          <p className="text-sm font-display font-bold text-foreground">Новый кандидат</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Имя *</label><Input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="bg-background" /></div>
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Фамилия *</label><Input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="bg-background" /></div>
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Должность</label><Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="bg-background" /></div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Департамент</label>
              <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
                <option value="">—</option>
                {topDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Телефон</label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-background" /></div>
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Email</label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-background" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate(form)} disabled={!form.first_name || !form.last_name} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50"><Plus size={14} className="inline mr-1" />Добавить</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">Отмена</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <UserPlus size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Нет кандидатов</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const dept = departments?.find(d => d.id === c.department_id);
            return (
              <div key={c.id} className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-display font-bold text-foreground">{c.first_name[0]}{c.last_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-foreground text-sm">{c.last_name} {c.first_name} {c.middle_name ?? ''}</p>
                  <p className="text-xs text-muted-foreground font-body">{c.position} {dept ? `• ${dept.name}` : ''}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-display font-bold ${c.status === 'candidate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : c.status === 'trainee' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                  {c.status === 'candidate' ? 'Кандидат' : c.status === 'trainee' ? 'Стажёр' : 'Принят'}
                </span>
                <button onClick={() => { if (confirm('Удалить кандидата?')) deleteMut.mutate(c.id); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
