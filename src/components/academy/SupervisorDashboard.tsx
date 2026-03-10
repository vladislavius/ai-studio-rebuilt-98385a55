import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle2, XCircle, ClipboardCheck, ShieldCheck, User, BookOpen, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { SupervisorStepComments } from './SupervisorTools';

interface CheckoutRequest {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;
  status: string;
  supervisor_notes: string | null;
  result: any;
  requested_at: string;
}

export function SupervisorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [commentEmpId, setCommentEmpId] = useState('');
  const [commentCourseId, setCommentCourseId] = useState('');
  const [commentStepId, setCommentStepId] = useState('');
  const [questions, setQuestions] = useState([
    { question: 'Объясни своими словами суть этого шага', answer: '', passed: false },
    { question: 'Приведи пример из своей работы', answer: '', passed: false },
    { question: 'Как применишь на практике?', answer: '', passed: false },
  ]);

  // My supervisor assignments (students assigned to me)
  const { data: myAssignments } = useQuery({
    queryKey: ['my-supervisor-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('course_supervisors')
        .select('*')
        .eq('supervisor_user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const studentIds = [...new Set((myAssignments ?? []).map(a => a.employee_id))];
  const courseIds = [...new Set((myAssignments ?? []).map(a => a.course_id))];

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, position');
      if (error) throw error;
      return data;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title, sections');
      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['supervisor-progress', studentIds.join(',')],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select('*')
        .in('employee_id', studentIds);
      if (error) throw error;
      return data;
    },
    enabled: studentIds.length > 0,
  });

  const { data: pendingCheckouts } = useQuery({
    queryKey: ['supervisor-checkouts', studentIds.join(',')],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('checkout_requests')
        .select('*')
        .in('employee_id', studentIds)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data as CheckoutRequest[];
    },
    enabled: studentIds.length > 0,
  });

  // Word clearing logs for assigned students
  const { data: wordLogs } = useQuery({
    queryKey: ['supervisor-word-logs', studentIds.join(',')],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('word_clearing_logs')
        .select('employee_id, term, cleared, created_at')
        .in('employee_id', studentIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as { employee_id: string; term: string; cleared: boolean; created_at: string }[];
    },
    enabled: studentIds.length > 0,
  });

  // Compute uncleared word counts per student
  const unclearedByEmployee = new Map<string, number>();
  const recentUnclearedByEmployee = new Map<string, string[]>();
  (wordLogs ?? []).forEach(log => {
    if (!log.cleared) {
      unclearedByEmployee.set(log.employee_id, (unclearedByEmployee.get(log.employee_id) ?? 0) + 1);
      const terms = recentUnclearedByEmployee.get(log.employee_id) ?? [];
      if (terms.length < 3) terms.push(log.term);
      recentUnclearedByEmployee.set(log.employee_id, terms);
    }
  });

  const reviewMut = useMutation({
    mutationFn: async ({ id, passed }: { id: string; passed: boolean }) => {
      const { error } = await supabase.from('checkout_requests').update({
        status: passed ? 'approved' : 'rejected',
        result: { questions, notes: reviewNotes },
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { passed }) => {
      toast.success(passed ? 'Чек-аут пройден ✓' : 'Назначена пересдача');
      qc.invalidateQueries({ queryKey: ['supervisor-checkouts'] });
      qc.invalidateQueries({ queryKey: ['checkout-requests'] });
      qc.invalidateQueries({ queryKey: ['pending-checkouts-notif'] });
      setReviewingId(null);
      setReviewNotes('');
      setQuestions(q => q.map(qq => ({ ...qq, answer: '', passed: false })));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const empMap = new Map(employees?.map(e => [e.id, e]) || []);
  const courseMap = new Map(courses?.map(c => [c.id, c.title]) || []);

  // Detect stuck students (< 50% after 7+ days)
  const stuckStudents = (progress ?? []).filter(p => {
    if (!p.started_at) return false;
    const days = (Date.now() - new Date(p.started_at).getTime()) / 86_400_000;
    return (p.progress_percent || 0) < 50 && days > 3;
  });

  if (!myAssignments?.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <User size={40} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-body text-muted-foreground">Вам не назначены студенты</p>
        <p className="text-xs text-muted-foreground mt-1">Администратор может назначить студентов во вкладке «Супервайзеры»</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Студентов</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{studentIds.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1"><ClipboardCheck size={10} className="text-rose-500" /> Чек-аутов</p>
          <p className="text-2xl font-display font-bold text-rose-500 mt-1">{pendingCheckouts?.length || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1"><AlertTriangle size={10} className="text-amber-500" /> Застряли</p>
          <p className="text-2xl font-display font-bold text-amber-500 mt-1">{stuckStudents.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1"><ShieldCheck size={10} className="text-primary" /> Курсов</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{courseIds.length}</p>
        </div>
      </div>

      {/* Pending checkouts */}
      {(pendingCheckouts?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck size={16} className="text-rose-500" />
            Ожидают чек-аута ({pendingCheckouts!.length})
          </h3>
          {pendingCheckouts!.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-display font-semibold text-foreground">{empMap.get(req.employee_id)?.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{courseMap.get(req.course_id) || '—'}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {new Date(req.requested_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              {req.supervisor_notes && (
                <p className="text-xs bg-muted/50 rounded-lg p-2 text-muted-foreground">«{req.supervisor_notes}»</p>
              )}

              {reviewingId === req.id ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Протокол чек-аута</p>
                  {questions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-display font-semibold text-foreground">{idx + 1}. {q.question}</p>
                      <Textarea
                        value={q.answer}
                        onChange={e => setQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, answer: e.target.value } : qq))}
                        placeholder="Ответ студента..."
                        rows={2}
                        className="bg-background resize-none text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.passed}
                          onChange={e => setQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, passed: e.target.checked } : qq))}
                          className="rounded"
                        />
                        Зачёт по вопросу
                      </label>
                    </div>
                  ))}
                  <Textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Общий комментарий..."
                    rows={2}
                    className="bg-background resize-none text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMut.mutate({ id: req.id, passed: true })}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Зачёт
                    </button>
                    <button
                      onClick={() => reviewMut.mutate({ id: req.id, passed: false })}
                      className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
                    >
                      <XCircle size={14} /> Пересдача
                    </button>
                    <button
                      onClick={() => setReviewingId(null)}
                      className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReviewingId(req.id)}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-rose-600 transition-colors"
                >
                  <ClipboardCheck size={14} /> Провести чек-аут
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student progress matrix */}
      <div className="space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
          <User size={16} className="text-primary" />
          Прогресс студентов
        </h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Студент</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Курс</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase w-36">Прогресс</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Статус</th>
                <th className="text-left p-3 text-[10px] font-display font-bold text-muted-foreground uppercase">Слова</th>
              </tr>
            </thead>
            <tbody>
              {(myAssignments ?? []).map(a => {
                const emp = empMap.get(a.employee_id);
                const p = (progress ?? []).find(pr => pr.employee_id === a.employee_id && pr.course_id === a.course_id);
                const percent = p?.progress_percent ?? 0;
                const isStuck = p && !p.completed_at && (() => {
                  const days = (Date.now() - new Date(p.started_at || Date.now()).getTime()) / 86_400_000;
                  return percent < 50 && days > 3;
                })();
                const unclearedCount = unclearedByEmployee.get(a.employee_id) ?? 0;

                return (
                  <tr key={a.id} className={`border-b border-border/50 hover:bg-accent/30 ${isStuck ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-3">
                      <p className="font-body text-foreground">{emp?.full_name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{emp?.position}</p>
                    </td>
                    <td className="p-3 font-body text-foreground text-xs">{courseMap.get(a.course_id) || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-display font-bold text-muted-foreground w-8">{percent}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {!p ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-display font-bold">Не начат</span>
                      ) : p.certified ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-display font-bold">Сертифицирован</span>
                      ) : p.completed_at ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-display font-bold">Завершён</span>
                      ) : isStuck ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-display font-bold flex items-center gap-1">
                          <AlertTriangle size={9} /> Застрял
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-display font-bold">В процессе</span>
                      )}
                    </td>
                    <td className="p-3">
                      {unclearedCount > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-display font-bold flex items-center gap-1" title={(recentUnclearedByEmployee.get(a.employee_id) ?? []).join(', ')}>
                          <BookOpen size={9} /> {unclearedCount} не выяснено
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step Comments */}
      {(() => {
        const commentCourseData = courses?.find(c => c.id === commentCourseId);
        const commentSteps = commentCourseData?.sections && Array.isArray(commentCourseData.sections)
          ? (commentCourseData.sections as { id: string; title: string }[])
          : [];
        const commentStepTitle = commentSteps.find(s => s.id === commentStepId)?.title || '';
        const commentStudents = [...new Set((myAssignments ?? []).map(a => a.employee_id))];
        const commentCourses = commentEmpId
          ? (myAssignments ?? []).filter(a => a.employee_id === commentEmpId).map(a => a.course_id)
          : [];
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              Комментарии к шагам
            </h3>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Студент</label>
                  <select value={commentEmpId} onChange={e => { setCommentEmpId(e.target.value); setCommentCourseId(''); setCommentStepId(''); }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none">
                    <option value="">Выберите студента...</option>
                    {commentStudents.map(id => <option key={id} value={id}>{empMap.get(id)?.full_name || id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Курс</label>
                  <select value={commentCourseId} onChange={e => { setCommentCourseId(e.target.value); setCommentStepId(''); }}
                    disabled={!commentEmpId}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none disabled:opacity-50">
                    <option value="">Выберите курс...</option>
                    {commentCourses.map(id => <option key={id} value={id}>{courseMap.get(id) || id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-display font-bold text-muted-foreground uppercase block mb-1">Шаг</label>
                  <select value={commentStepId} onChange={e => setCommentStepId(e.target.value)}
                    disabled={!commentCourseId || commentSteps.length === 0}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-body text-foreground focus:outline-none disabled:opacity-50">
                    <option value="">Выберите шаг...</option>
                    {commentSteps.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              {commentEmpId && commentCourseId && commentStepId && (
                <SupervisorStepComments
                  courseId={commentCourseId}
                  employeeId={commentEmpId}
                  stepId={commentStepId}
                  stepTitle={commentStepTitle}
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Word clearing alerts */}
      {unclearedByEmployee.size > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-rose-500" />
            Невыясненные слова ({[...unclearedByEmployee.values()].reduce((a, b) => a + b, 0)} всего)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...unclearedByEmployee.entries()].map(([empId, count]) => {
              const emp = empMap.get(empId);
              const terms = recentUnclearedByEmployee.get(empId) ?? [];
              return (
                <div key={empId} className="bg-card border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-display font-semibold text-foreground">{emp?.full_name || '—'}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-display font-bold">{count} слов</span>
                  </div>
                  {terms.length > 0 && (
                    <p className="text-xs text-muted-foreground font-body">
                      Не выяснено: {terms.map((t, i) => <span key={i} className="italic">«{t}»</span>).reduce((a, b) => <>{a}, {b}</>)}
                      {count > terms.length && ` и ещё ${count - terms.length}...`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
