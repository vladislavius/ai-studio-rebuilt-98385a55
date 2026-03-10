import { useState } from 'react';
import { GraduationCap, BookOpen, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function AcademyPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_hours: '' });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (c: typeof form) => {
      const { error } = await supabase.from('courses').insert([{
        title: c.title,
        description: c.description || null,
        duration_hours: c.duration_hours ? parseFloat(c.duration_hours) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Курс создан'); setShowForm(false); setForm({ title: '', description: '', duration_hours: '' }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('courses').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Курс удалён'); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>;

  const items = courses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Академия</h1>
          <p className="text-sm text-muted-foreground font-body">Система обучения и развития сотрудников • {items.length} курсов</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Создать курс
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
          <p className="text-sm font-display font-bold text-foreground">Новый курс</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-background" /></div>
            <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Длительность (часов)</label><Input type="number" value={form.duration_hours} onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))} className="bg-background" /></div>
          </div>
          <div><label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Описание</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="bg-background resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate(form)} disabled={!form.title} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50">Создать</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">Отмена</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <GraduationCap size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">Нет курсов. Создайте первый!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(course => {
            const sections = Array.isArray(course.sections) ? course.sections.length : 0;
            return (
              <div key={course.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all group relative">
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePublish.mutate({ id: course.id, published: !course.is_published })} className="p-1.5 rounded hover:bg-accent text-muted-foreground" title={course.is_published ? 'Снять с публикации' : 'Опубликовать'}>
                      {course.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => { if (confirm('Удалить курс?')) deleteMut.mutate(course.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen size={20} className="text-primary" />
                  </div>
                  <span className={`text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-1 rounded ${course.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {course.is_published ? 'Активен' : 'Черновик'}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                {course.description && <p className="text-xs text-muted-foreground font-body mb-2 line-clamp-2">{course.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                  <span>{sections} секций</span>
                  {course.duration_hours && <span>{course.duration_hours} ч.</span>}
                  {course.is_hst_course && <span className="text-primary font-display font-bold">HST</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
