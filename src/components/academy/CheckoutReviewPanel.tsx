import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck, CheckCircle2, XCircle, User, Clock, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CheckoutRequest {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;
  status: string;
  supervisor_notes: string | null;
  questions: any;
  result: any;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export function CheckoutReviewPanel() {
  const qc = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewQuestions, setReviewQuestions] = useState([
    { question: 'Объясни своими словами суть этого шага', answer: '', passed: false },
    { question: 'Приведи пример из своей работы', answer: '', passed: false },
    { question: 'Как применишь на практике?', answer: '', passed: false },
  ]);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['checkout-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return data as CheckoutRequest[];
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
      const { data, error } = await supabase.from('courses').select('id, title, sections');
      if (error) throw error;
      return data;
    },
  });

  const reviewMut = useMutation({
    mutationFn: async ({ id, passed }: { id: string; passed: boolean }) => {
      const { error } = await supabase.from('checkout_requests').update({
        status: passed ? 'approved' : 'rejected',
        result: { questions: reviewQuestions, notes: reviewNotes },
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { passed }) => {
      toast.success(passed ? 'Чек-аут пройден ✓' : 'Чек-аут не пройден — назначена пересдача');
      qc.invalidateQueries({ queryKey: ['checkout-requests'] });
      setReviewingId(null);
      setReviewNotes('');
      setReviewQuestions(q => q.map(qq => ({ ...qq, answer: '', passed: false })));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const empMap = new Map(employees?.map(e => [e.id, e.full_name]) || []);
  const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

  const getStepTitle = (courseId: string, stepId: string) => {
    const course = courseMap.get(courseId);
    if (!course?.sections || !Array.isArray(course.sections)) return stepId;
    const step = (course.sections as any[]).find((s: any) => s.id === stepId);
    return step?.title || stepId;
  };

  const pending = requests?.filter(r => r.status === 'pending') || [];
  const reviewed = requests?.filter(r => r.status !== 'pending') || [];

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
        <ClipboardCheck size={16} className="text-rose-500" /> Чек-ауты
      </h3>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Ожидают проверки ({pending.length})</p>
          {pending.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span className="text-sm font-display font-semibold text-foreground">{empMap.get(req.employee_id) || '—'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  {new Date(req.requested_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Курс: <span className="text-foreground font-semibold">{courseMap.get(req.course_id)?.title || '—'}</span> →
                Шаг: <span className="text-foreground font-semibold">{getStepTitle(req.course_id, req.step_id)}</span>
              </p>
              {req.supervisor_notes && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  <MessageSquare size={10} className="inline mr-1" /> {req.supervisor_notes}
                </p>
              )}

              {reviewingId === req.id ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Протокол чек-аута</p>
                  {reviewQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs font-display font-semibold text-foreground">{idx + 1}. {q.question}</p>
                      <Textarea
                        value={q.answer}
                        onChange={e => setReviewQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, answer: e.target.value } : qq))}
                        placeholder="Ответ студента..."
                        rows={2}
                        className="bg-background resize-none text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.passed}
                          onChange={e => setReviewQuestions(prev => prev.map((qq, i) => i === idx ? { ...qq, passed: e.target.checked } : qq))}
                          className="rounded"
                        />
                        Зачёт по вопросу
                      </label>
                    </div>
                  ))}
                  <Textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Общий комментарий супервизора..."
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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-display font-bold flex items-center gap-1.5"
                >
                  <ClipboardCheck size={14} /> Провести чек-аут
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <ClipboardCheck size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет ожидающих чек-аутов</p>
        </div>
      )}

      {/* History */}
      {reviewed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">История ({reviewed.length})</p>
          {reviewed.slice(0, 10).map(req => (
            <div key={req.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              {req.status === 'approved' ? (
                <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-destructive flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-semibold text-foreground">{empMap.get(req.employee_id) || '—'}</p>
                <p className="text-[10px] text-muted-foreground">{getStepTitle(req.course_id, req.step_id)}</p>
              </div>
              <span className={`text-[10px] font-display font-bold px-2 py-1 rounded ${req.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {req.status === 'approved' ? 'Зачёт' : 'Пересдача'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
