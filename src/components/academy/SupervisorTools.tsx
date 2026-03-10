import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Plus, ClipboardList, Check, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Supervisor Step Comments ────────────────────────────────────────────────

interface StepComment {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;
  comment: string;
  supervisor_user_id: string;
  created_at: string;
}

interface CommentsPanelProps {
  courseId: string;
  employeeId: string;
  stepId: string;
  stepTitle: string;
}

export function SupervisorStepComments({ courseId, employeeId, stepId, stepTitle }: CommentsPanelProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['step-comments', courseId, employeeId, stepId],
    queryFn: async () => {
      const { data, error } = await supabase.from('supervisor_step_comments').select('*')
        .eq('course_id', courseId).eq('employee_id', employeeId).eq('step_id', stepId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as StepComment[];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('supervisor_step_comments').insert({
        course_id: courseId, employee_id: employeeId, step_id: stepId,
        comment: text, supervisor_user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['step-comments', courseId, employeeId, stepId] });
      toast.success('Комментарий добавлен');
      setText('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supervisor_step_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['step-comments', courseId, employeeId, stepId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1">
        <MessageSquare size={10} /> Комментарии к шагу «{stepTitle}»
      </p>
      {comments.map(c => (
        <div key={c.id} className="flex items-start gap-2 bg-muted/30 rounded-lg p-2">
          <MessageSquare size={12} className="text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-body text-foreground">{c.comment}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <button onClick={() => deleteMut.mutate(c.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 size={10} />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && text && addMut.mutate()}
          placeholder="Добавить комментарий к шагу..."
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => addMut.mutate()}
          disabled={!text || addMut.isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}


// ─── Extra Assignments ────────────────────────────────────────────────────────

interface ExtraAssignment {
  id: string;
  employee_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export function ExtraAssignmentsManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: '', course_id: '', title: '', description: '', due_date: '' });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['extra-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('extra_assignments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as ExtraAssignment[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name');
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
      const { error } = await supabase.from('extra_assignments').insert({
        employee_id: form.employee_id,
        course_id: form.course_id || null,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        assigned_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extra-assignments'] });
      toast.success('Задание назначено');
      setShowForm(false);
      setForm({ employee_id: '', course_id: '', title: '', description: '', due_date: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('extra_assignments').update({ completed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extra-assignments'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('extra_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extra-assignments'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const empMap = new Map(employees?.map(e => [e.id, e.full_name]) || []);
  const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" /> Дополнительные задания
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
        >
          <Plus size={14} /> Назначить задание
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-display font-bold text-foreground">Новое доп. задание</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Студент *</label>
              <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none">
                <option value="">Выберите студента...</option>
                {employees?.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Курс (опционально)</label>
              <select value={form.course_id} onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none">
                <option value="">Без курса</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Название задания *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Например: Повторить демо шага 3"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Срок выполнения</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Описание</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Подробное описание задания..." rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMut.mutate()} disabled={!form.employee_id || !form.title || createMut.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50">
              Назначить
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">
              Отмена
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <Loader2 size={14} className="animate-spin" /> Загрузка...
        </div>
      ) : assignments?.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <ClipboardList size={32} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет дополнительных заданий</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments?.map(a => {
            const isOverdue = !a.completed_at && a.due_date && new Date(a.due_date) < new Date();
            return (
              <div key={a.id} className={`bg-card border rounded-xl p-3 flex items-start gap-3 ${a.completed_at ? 'border-primary/20 opacity-70' : isOverdue ? 'border-destructive/30' : 'border-border'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.completed_at ? 'bg-primary/10' : 'bg-muted'}`}>
                  {a.completed_at ? <Check size={14} className="text-primary" /> : <ClipboardList size={14} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-display font-semibold ${a.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{a.title}</p>
                    {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-display font-bold">Просрочено</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{empMap.get(a.employee_id) || '—'}{a.course_id ? ` • ${courseMap.get(a.course_id)}` : ''}</p>
                  {a.description && <p className="text-[10px] text-muted-foreground font-body mt-0.5">{a.description}</p>}
                  {a.due_date && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CalendarDays size={9} /> До {new Date(a.due_date).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!a.completed_at && (
                    <button onClick={() => completeMut.mutate(a.id)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary" title="Отметить выполненным">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteMut.mutate(a.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
