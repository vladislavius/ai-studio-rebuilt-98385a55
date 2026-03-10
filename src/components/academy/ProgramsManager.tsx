import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Save, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProgramCourse {
  id: string;
  course_id: string;
  sort_order: number;
  is_required: boolean;
}

export function ProgramsManager() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [showCreate, setShowCreate] = useState(false);

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: programCourses } = useQuery({
    queryKey: ['program-courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('program_courses').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title');
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('programs').insert({ title: form.title, description: form.description || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Программа создана');
      setShowCreate(false);
      setForm({ title: '', description: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Программа удалена');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('programs').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addCourseMut = useMutation({
    mutationFn: async ({ programId, courseId }: { programId: string; courseId: string }) => {
      const existing = programCourses?.filter(pc => pc.program_id === programId) || [];
      const { error } = await supabase.from('program_courses').insert({
        program_id: programId,
        course_id: courseId,
        sort_order: existing.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program-courses'] });
      toast.success('Курс добавлен');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCourseMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('program_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program-courses'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-bold text-foreground">Программы обучения</h3>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold flex items-center gap-1 hover:bg-primary/20">
            <Plus size={14} /> Создать программу
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Название программы" className="bg-background" />
          <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Описание" rows={2} className="bg-background resize-none" />
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate()} disabled={!form.title} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50">Создать</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">Отмена</button>
          </div>
        </div>
      )}

      {(programs?.length ?? 0) === 0 && !showCreate && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground font-body">Нет программ обучения</p>
        </div>
      )}

      {programs?.map(prog => {
        const progCourses = programCourses?.filter(pc => pc.program_id === prog.id).sort((a, b) => a.sort_order - b.sort_order) || [];
        const assignedCourseIds = new Set(progCourses.map(pc => pc.course_id));
        const availableCourses = courses?.filter(c => !assignedCourseIds.has(c.id)) || [];
        const isExpanded = editingId === prog.id;

        return (
          <div key={prog.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setEditingId(isExpanded ? null : prog.id)} className="p-1 text-muted-foreground">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-display font-bold text-foreground">{prog.title}</h4>
                {prog.description && <p className="text-xs text-muted-foreground font-body line-clamp-1">{prog.description}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground">{progCourses.length} курсов</span>
              <span className={`text-[10px] font-display font-bold px-2 py-1 rounded ${prog.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {prog.is_published ? 'Опубл.' : 'Черновик'}
              </span>
              {isAdmin && (
                <div className="flex gap-1">
                  <button onClick={() => togglePublish.mutate({ id: prog.id, published: !prog.is_published })} className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                    {prog.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => { if (confirm('Удалить программу?')) deleteMut.mutate(prog.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-2 bg-muted/20">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Курсы в программе</p>
                {progCourses.length === 0 && <p className="text-xs text-muted-foreground font-body">Нет курсов</p>}
                {progCourses.map((pc, idx) => (
                  <div key={pc.id} className="flex items-center gap-2 p-2 bg-background rounded-lg">
                    <span className="text-xs font-display font-bold text-muted-foreground w-6">{idx + 1}.</span>
                    <span className="flex-1 text-xs font-body text-foreground">{courseMap.get(pc.course_id) || '—'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${pc.is_required ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {pc.is_required ? 'Обязат.' : 'Доп.'}
                    </span>
                    {isAdmin && (
                      <button onClick={() => removeCourseMut.mutate(pc.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {isAdmin && availableCourses.length > 0 && (
                  <select
                    onChange={e => { if (e.target.value) addCourseMut.mutate({ programId: prog.id, courseId: e.target.value }); e.target.value = ''; }}
                    className="w-full h-8 text-xs bg-background border border-border rounded-lg px-2"
                    defaultValue=""
                  >
                    <option value="" disabled>+ Добавить курс...</option>
                    {availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
