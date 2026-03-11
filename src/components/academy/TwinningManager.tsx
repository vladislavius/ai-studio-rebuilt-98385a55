import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Plus, Check, X, Clock, CalendarDays, Loader2, Shuffle, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type TwinningStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

interface TwinningSession {
  id: string;
  course_id: string;
  step_id: string;
  employee_a_id: string;
  employee_b_id: string;
  scheduled_at: string | null;
  completed_at: string | null;
  status: TwinningStatus;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<TwinningStatus, { label: string; chip: string }> = {
  pending:   { label: 'Ожидает',   chip: 'bg-muted text-muted-foreground border-border' },
  scheduled: { label: 'Запланирована', chip: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  completed: { label: 'Завершена',  chip: 'bg-primary/10 text-primary border-primary/20' },
  cancelled: { label: 'Отменена',  chip: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function TwinningManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ course_id: '', step_id: '', employee_a_id: '', employee_b_id: '', scheduled_at: '', notes: '' });
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [autoMatchCourseId, setAutoMatchCourseId] = useState('');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['twinning-sessions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('twinning_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TwinningSession[];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title, sections').eq('is_published', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, position');
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('twinning_sessions').insert({
        course_id: form.course_id,
        step_id: form.step_id,
        employee_a_id: form.employee_a_id,
        employee_b_id: form.employee_b_id,
        scheduled_at: form.scheduled_at || null,
        notes: form.notes || null,
        supervisor_user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twinning-sessions'] });
      toast.success('Парная сессия создана');
      setShowForm(false);
      setForm({ course_id: '', step_id: '', employee_a_id: '', employee_b_id: '', scheduled_at: '', notes: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Auto-match: pair up unmatched students enrolled in a course
  const autoMatchMut = useMutation({
    mutationFn: async (courseId: string) => {
      const { data: enrolled } = await supabase.from('course_supervisors').select('employee_id').eq('course_id', courseId);
      const empIds = (enrolled ?? []).map(r => r.employee_id);
      if (empIds.length < 2) throw new Error('Нужно минимум 2 студента на курсе');
      // find already paired employees for this course
      const { data: existing } = await (supabase as any).from('twinning_sessions').select('employee_a_id, employee_b_id')
        .eq('course_id', courseId).in('status', ['pending', 'scheduled']);
      const paired = new Set<string>();
      (existing ?? []).forEach(s => { paired.add(s.employee_a_id); paired.add(s.employee_b_id); });
      const unpaired = empIds.filter(id => !paired.has(id));
      if (unpaired.length < 2) throw new Error('Все студенты уже в парах');
      // shuffle
      for (let i = unpaired.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unpaired[i], unpaired[j]] = [unpaired[j], unpaired[i]];
      }
      const pairs: { employee_a_id: string; employee_b_id: string; course_id: string; step_id: string; supervisor_user_id: string | undefined }[] = [];
      for (let i = 0; i + 1 < unpaired.length; i += 2) {
        pairs.push({ employee_a_id: unpaired[i], employee_b_id: unpaired[i + 1], course_id: courseId, step_id: 'auto', supervisor_user_id: user?.id });
      }
      const { error } = await (supabase as any).from('twinning_sessions').insert(pairs);
      if (error) throw error;
      return pairs.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['twinning-sessions'] });
      toast.success(`Создано ${count} пар`);
      setAutoMatchCourseId('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Submit feedback for a completed session
  const feedbackMut = useMutation({
    mutationFn: async ({ sessionId, employeeId }: { sessionId: string; employeeId: string }) => {
      const { error } = await (supabase as any).from('twinning_feedback').upsert({
        session_id: sessionId, employee_id: employeeId,
        rating: feedbackRating, notes: feedbackNotes || null,
      }, { onConflict: 'session_id,employee_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Фидбек сохранён');
      setFeedbackSessionId(null);
      setFeedbackRating(5);
      setFeedbackNotes('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TwinningStatus }) => {
      const patch: any = { status };
      if (status === 'completed') patch.completed_at = new Date().toISOString();
      const { error } = await (supabase as any).from('twinning_sessions').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['twinning-sessions'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const empMap = new Map(employees?.map(e => [e.id, e]) || []);
  const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

  const selectedCourseSteps = (() => {
    if (!form.course_id) return [];
    const c = courseMap.get(form.course_id);
    if (!c?.sections || !Array.isArray(c.sections)) return [];
    return (c.sections as any[]).sort((a, b) => a.order - b.order);
  })();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 size={14} className="animate-spin" /> Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" /> Парные упражнения (твиннинг)
          </h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Назначайте студентов в пары для совместной отработки навыков</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <select
              value={autoMatchCourseId}
              onChange={e => setAutoMatchCourseId(e.target.value)}
              className="h-8 px-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none"
            >
              <option value="">Курс для автопар...</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button
              onClick={() => autoMatchCourseId && autoMatchMut.mutate(autoMatchCourseId)}
              disabled={!autoMatchCourseId || autoMatchMut.isPending}
              className="px-3 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1.5 disabled:opacity-50"
              title="Автоподбор пар"
            >
              <Shuffle size={14} /> Авто
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
          >
            <Plus size={14} /> Создать пару
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-xs font-display font-bold text-foreground">Новая парная сессия</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Курс *</label>
              <select
                value={form.course_id}
                onChange={e => setForm(p => ({ ...p, course_id: e.target.value, step_id: '' }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Выберите курс...</option>
                {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Шаг *</label>
              <select
                value={form.step_id}
                onChange={e => setForm(p => ({ ...p, step_id: e.target.value }))}
                disabled={!form.course_id}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">Выберите шаг...</option>
                {selectedCourseSteps.map((s: any) => <option key={s.id} value={s.id}>{s.order}. {s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Студент А *</label>
              <select
                value={form.employee_a_id}
                onChange={e => setForm(p => ({ ...p, employee_a_id: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Выберите сотрудника...</option>
                {employees?.filter(e => e.id !== form.employee_b_id).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Студент Б *</label>
              <select
                value={form.employee_b_id}
                onChange={e => setForm(p => ({ ...p, employee_b_id: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Выберите сотрудника...</option>
                {employees?.filter(e => e.id !== form.employee_a_id).map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Дата и время</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Примечание</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Место встречи, формат..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.course_id || !form.step_id || !form.employee_a_id || !form.employee_b_id || createMut.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50"
            >
              Создать
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground">
              Отмена
            </button>
          </div>
        </div>
      )}

      {sessions?.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">Нет парных сессий</p>
          <p className="text-xs text-muted-foreground mt-1">Назначьте студентов в пары для совместной практики</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Пара</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Курс / Шаг</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Дата</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Статус</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {sessions?.map(s => {
                const empA = empMap.get(s.employee_a_id);
                const empB = empMap.get(s.employee_b_id);
                const course = courseMap.get(s.course_id);
                const step = course?.sections && Array.isArray(course.sections)
                  ? (course.sections as any[]).find((st: any) => st.id === s.step_id)
                  : null;
                const cfg = STATUS_CONFIG[s.status];
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="p-3">
                      <p className="font-body text-foreground text-xs">{empA?.full_name || '—'}</p>
                      <p className="font-body text-muted-foreground text-[10px]">↔ {empB?.full_name || '—'}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-body text-foreground text-xs truncate max-w-[160px]">{course?.title || '—'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{step?.title || s.step_id}</p>
                    </td>
                    <td className="p-3">
                      {s.scheduled_at ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays size={10} />
                          {new Date(s.scheduled_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock size={10} /> Не назначена</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-display font-bold ${cfg.chip}`}>{cfg.label}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        {s.status === 'pending' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: s.id, status: 'scheduled' })}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground text-[10px] font-display font-bold"
                            title="Запланировать"
                          >
                            <Clock size={12} />
                          </button>
                        )}
                        {(s.status === 'pending' || s.status === 'scheduled') && (
                          <button
                            onClick={() => updateStatus.mutate({ id: s.id, status: 'completed' })}
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                            title="Завершить"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {s.status !== 'cancelled' && s.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: s.id, status: 'cancelled' })}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Отменить"
                          >
                            <X size={12} />
                          </button>
                        )}
                        {s.status === 'completed' && (
                          <button
                            onClick={() => setFeedbackSessionId(feedbackSessionId === s.id ? null : s.id)}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                            title="Оставить фидбек"
                          >
                            <MessageSquare size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback form */}
      {feedbackSessionId && (() => {
        const s = sessions?.find(s => s.id === feedbackSessionId);
        const empA = s ? empMap.get(s.employee_a_id) : null;
        const empB = s ? empMap.get(s.employee_b_id) : null;
        return (
          <div className="bg-card border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-display font-bold text-foreground flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" />
                Фидбек по сессии: {empA?.full_name} ↔ {empB?.full_name}
              </p>
              <button onClick={() => setFeedbackSessionId(null)}><X size={14} className="text-muted-foreground" /></button>
            </div>
            <div>
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-2">Оценка сессии</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setFeedbackRating(n)}
                    className={`p-1.5 rounded transition-colors ${feedbackRating >= n ? 'text-amber-500' : 'text-muted-foreground/30'}`}>
                    <Star size={20} fill={feedbackRating >= n ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Комментарий</label>
              <textarea
                value={feedbackNotes}
                onChange={e => setFeedbackNotes(e.target.value)}
                placeholder="Что прошло хорошо? Что улучшить?"
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={() => {
                const s = sessions?.find(s => s.id === feedbackSessionId);
                if (!s) return;
                // use employee_a as the submitter (simplified; in real app use current user's employee_id)
                feedbackMut.mutate({ sessionId: feedbackSessionId, employeeId: s.employee_a_id });
              }}
              disabled={feedbackMut.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold disabled:opacity-50"
            >
              Сохранить фидбек
            </button>
          </div>
        );
      })()}
    </div>
  );
}
