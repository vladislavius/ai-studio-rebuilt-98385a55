import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, PenLine, Eye, Dumbbell, Star, Check, Award, Sparkles, Search, ClipboardCheck, HelpCircle, Lock, FileQuestion } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { WordClearingPanel } from './WordClearingPanel';
import { CheckoutRequestPanel } from './CheckoutRequestPanel';
import { StepArtifactUpload } from './StepArtifactUpload';
import { QuizStep } from './QuizStep';
import { CourseCertificate } from './CourseCertificate';
import { RichTextViewer, RichTextEditor } from './RichTextEditor';
import { TrainingChat } from './TrainingChat';
import { JitsiVideoCall } from './JitsiVideoCall';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useBadgeAutoAward, StudentBadges } from './LeaderboardAndBadges';

interface ChecksheetItem {
  id: string;
  order: number;
  type: 'read' | 'write' | 'demo' | 'drill' | 'starrate' | 'clay_demo' | 'checkout' | 'word_clearing' | 'quiz';
  title: string;
  content: string;
  task?: string;
  critical?: boolean;
  needsCheckout?: boolean;
  starred?: boolean;
  quizQuestions?: { question: string; options: string[]; correctIndex: number; correctIndices?: number[]; multiSelect?: boolean }[];
}

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string; border?: string }> = {
  read:          { label: 'Прочитать',       icon: BookOpen,      color: 'text-blue-500',    border: 'border-l-blue-400' },
  write:         { label: 'Написать',        icon: PenLine,       color: 'text-amber-500',   border: 'border-l-amber-400' },
  demo:          { label: 'Демо',            icon: Eye,           color: 'text-emerald-500', border: 'border-l-emerald-400' },
  clay_demo:     { label: 'Пластилиновое демо',   icon: Sparkles,      color: 'text-teal-500',    border: 'border-l-teal-400' },
  drill:         { label: 'Упражнение',      icon: Dumbbell,      color: 'text-purple-500',  border: 'border-l-purple-400' },
  checkout:      { label: 'Чек-аут',         icon: ClipboardCheck, color: 'text-rose-500',   border: 'border-l-rose-400' },
  word_clearing: { label: 'Прояснение слов', icon: Search,        color: 'text-cyan-500',    border: 'border-l-cyan-400' },
  starrate:      { label: 'Звёздная оценка', icon: Star,          color: 'text-orange-500',  border: 'border-l-orange-400' },
  quiz:          { label: 'Тест',            icon: FileQuestion,  color: 'text-indigo-500',  border: 'border-l-indigo-400' },
};

interface Props {
  courseId: string;
  onBack: () => void;
  employeeId?: string;
}

export function CourseStudyView({ courseId, onBack, employeeId }: Props) {
  const qc = useQueryClient();
  useBadgeAutoAward(employeeId);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [showWordClearing, setShowWordClearing] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [answerSaving, setAnswerSaving] = useState(false);
  const [stepHasArtifact, setStepHasArtifact] = useState(false);
  const [starRatings, setStarRatings] = useState<Record<string, number>>({});

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: progressRecord } = useQuery({
    queryKey: ['my-course-progress', courseId, employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data, error } = await supabase.from('course_progress')
        .select('*').eq('course_id', courseId).eq('employee_id', employeeId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: checkoutRequests } = useQuery({
    queryKey: ['checkout-requests', courseId, employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase.from('checkout_requests')
        .select('*').eq('course_id', courseId).eq('employee_id', employeeId);
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data, error } = await supabase.from('employees').select('full_name').eq('id', employeeId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  // Course glossary terms (shown on word_clearing steps)
  const { data: courseGlossary } = useQuery({
    queryKey: ['glossary-terms', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('glossary_terms').select('id, term, definition')
        .or(`course_id.eq.${courseId},course_id.is.null`).order('term');
      return (data ?? []) as { id: string; term: string; definition: string }[];
    },
  });

  // Twinning sessions for this student on this course
  const { data: myTwinning } = useQuery({
    queryKey: ['my-twinning', courseId, employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await (supabase as any)
        .from('twinning_sessions')
        .select('id, step_id, status, scheduled_at, notes, employee_a_id, employee_b_id')
        .eq('course_id', courseId)
        .or(`employee_a_id.eq.${employeeId},employee_b_id.eq.${employeeId}`)
        .in('status', ['pending', 'scheduled'])
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; step_id: string; status: string; scheduled_at: string | null; notes: string | null; employee_a_id: string; employee_b_id: string }[];
    },
    enabled: !!employeeId,
  });

  const { data: allWordLogs } = useQuery({
    queryKey: ['word-clearing-all', courseId, employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase.from('word_clearing_logs')
        .select('id, step_id, cleared').eq('course_id', courseId).eq('employee_id', employeeId);
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const items: ChecksheetItem[] = course && Array.isArray(course.sections)
    ? (course.sections as unknown as ChecksheetItem[]).sort((a, b) => a.order - b.order)
    : [];

  // Load saved student answers
  const { data: savedAnswers } = useQuery({
    queryKey: ['student-answers', courseId, employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase.from('student_answers')
        .select('step_id, answer_html')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (savedAnswers) {
      const map: Record<string, string> = {};
      savedAnswers.forEach(a => { map[a.step_id] = a.answer_html; });
      setStudentAnswers(map);
    }
  }, [savedAnswers]);

  useEffect(() => {
    if (progressRecord?.completed_sections && Array.isArray(progressRecord.completed_sections)) {
      setCompletedIds(progressRecord.completed_sections as string[]);
      const completed = new Set(progressRecord.completed_sections as string[]);
      const firstIncomplete = items.findIndex(it => !completed.has(it.id));
      if (firstIncomplete >= 0) setActiveIdx(firstIncomplete);
    }
  }, [progressRecord, items.length]);

  // NOTE: activeItem is declared below — use activeIdx as dependency to avoid TDZ
  useEffect(() => {
    const item = items[activeIdx];
    if (item?.type === 'word_clearing') {
      setShowWordClearing(true);
    }
    setStepHasArtifact(false);
  }, [activeIdx, items]);

  // Save student answer with debounce
  const saveAnswer = async (stepId: string, html: string) => {
    if (!employeeId) return;
    setAnswerSaving(true);
    try {
      const { error } = await supabase.from('student_answers').upsert({
        course_id: courseId,
        employee_id: employeeId,
        step_id: stepId,
        answer_html: html,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'course_id,employee_id,step_id' });
      if (error) throw error;
    } catch (e: any) {
      toast.error('Ошибка сохранения ответа');
    } finally {
      setAnswerSaving(false);
    }
  };

  const completeMut = useMutation({
    mutationFn: async (itemId: string) => {
      if (!employeeId) return;
      
      let progressId = progressRecord?.id;
      
      // Auto-create progress record if it doesn't exist
      if (!progressId) {
        const { data: newProgress, error: insertErr } = await supabase.from('course_progress').insert({
          course_id: courseId,
          employee_id: employeeId,
          progress_percent: 0,
          completed_sections: [],
        }).select('id').single();
        if (insertErr) throw insertErr;
        progressId = newProgress.id;
      }
      
      const newCompleted = [...completedIds, itemId];
      const percent = Math.round((newCompleted.length / items.length) * 100);
      const isComplete = percent >= 100;
      const { error } = await supabase.from('course_progress').update({
        completed_sections: newCompleted,
        progress_percent: percent,
        ...(isComplete ? { completed_at: new Date().toISOString(), certified: true } : {}),
      }).eq('id', progressId);
      if (error) throw error;
      return { newCompleted, percent, isComplete };
    },
    onSuccess: (result) => {
      if (!result) return;
      setCompletedIds(result.newCompleted);
      qc.invalidateQueries({ queryKey: ['my-course-progress', courseId] });
      if (result.isComplete) {
        toast.success('🎉 Контрольный лист завершён!');
      } else {
        toast.success('✓ Шаг выполнен');
        const nextIdx = activeIdx + 1;
        if (nextIdx < items.length) setActiveIdx(nextIdx);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeItem = items[activeIdx];
  const progressPercent = items.length > 0 ? Math.round((completedIds.length / items.length) * 100) : 0;
  const isItemCompleted = (id: string) => completedIds.includes(id);
  const allComplete = progressPercent >= 100;

  // Check if a step is accessible (sequential locking)
  const isStepLocked = (idx: number): boolean => {
    if (idx === 0) return false;
    // All previous steps must be completed
    for (let i = 0; i < idx; i++) {
      if (!completedIds.includes(items[i].id)) return true;
    }
    return false;
  };

  const isStepBlocked = (item: ChecksheetItem, idx?: number): { blocked: boolean; reason: string } => {
    // Sequential lock check
    if (idx !== undefined && employeeId && isStepLocked(idx)) {
      return { blocked: true, reason: 'Сначала выполните предыдущие шаги' };
    }
    if ((item.type === 'checkout' || item.needsCheckout) && employeeId) {
      const req = checkoutRequests?.find(r => r.step_id === item.id);
      if (!req) return { blocked: true, reason: 'Требуется чек-аут супервизора' };
      if (req.status === 'pending') return { blocked: true, reason: 'Чек-аут ожидает проверки' };
      if (req.status === 'rejected') return { blocked: true, reason: 'Чек-аут не пройден — пересдача' };
    }
    if (item.type === 'word_clearing' && employeeId) {
      const stepLogs = (allWordLogs ?? []).filter(l => l.step_id === item.id);
      if (stepLogs.length === 0) return { blocked: true, reason: 'Добавьте непонятые слова и проясните их' };
      const uncleared = stepLogs.filter(l => !l.cleared);
      if (uncleared.length > 0) return { blocked: true, reason: `Осталось прояснить слов: ${uncleared.length}` };
    }
    return { blocked: false, reason: '' };
  };

  const activeBlocked = activeItem ? isStepBlocked(activeItem, activeIdx) : { blocked: false, reason: '' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-display font-bold text-foreground truncate">{course?.title || 'Загрузка...'}</h1>
          <p className="text-[11px] text-muted-foreground font-body">{completedIds.length} / {items.length} шагов</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <p className={`text-sm font-display font-bold ${allComplete ? 'text-emerald-500' : 'text-primary'}`}>{progressPercent}%</p>
            <p className="text-[10px] text-muted-foreground">прогресс</p>
          </div>
          {allComplete && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-display font-bold">
              <Award size={14} /> Завершён
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${allComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary via-primary/80 to-primary/60'}`} style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Certificate */}
      {allComplete && progressRecord?.completed_at && course && (
        <CourseCertificate
          courseName={course.title}
          employeeName={employee?.full_name || '—'}
          completedAt={progressRecord.completed_at}
        />
      )}

      {/* Badges */}
      {employeeId && <StudentBadges employeeId={employeeId} />}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0 border border-border rounded-2xl overflow-hidden shadow-sm" style={{ minHeight: '70vh' }}>
        {/* Sidebar — checksheet list */}
        <div className="bg-card/80 backdrop-blur-sm border-r border-border overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">Контрольный лист</p>
              <span className="text-[10px] font-display font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{completedIds.length}/{items.length}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.map((item, idx) => {
              const meta = TYPE_META[item.type] || TYPE_META.read;
              const Icon = meta.icon;
              const done = isItemCompleted(item.id);
              const isActive = idx === activeIdx;
              const blocked = isStepBlocked(item, idx);
              const locked = employeeId ? isStepLocked(idx) : false;
              return (
                <button
                  key={item.id}
                  onClick={() => { if (!locked) setActiveIdx(idx); }}
                  disabled={locked}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 border-b border-border/30 transition-all duration-150 border-l-[3px] ${isActive ? `bg-primary/8 border-l-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.08)]` : done ? 'border-l-transparent hover:bg-accent/40' : 'border-l-transparent hover:bg-accent/40'} ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${done ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : isActive ? 'bg-primary/10 border-2 border-primary' : locked ? 'border border-border bg-muted/50' : 'border border-border/60 bg-background'}`}>
                    {done ? <Check size={10} /> : locked ? <Lock size={8} className="text-muted-foreground/50" /> : <span className="text-[9px] font-bold text-muted-foreground">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1">
                      <p className={`text-[11px] font-body leading-tight ${done ? 'text-muted-foreground/60 line-through' : isActive ? 'text-foreground font-medium' : 'text-foreground/80'}`}>{item.title || 'Без заголовка'}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Icon size={9} className={`${meta.color} opacity-70`} />
                      <span className={`text-[9px] ${meta.color} opacity-70 font-display`}>{meta.label}</span>
                      {item.critical && <span className="text-[8px] text-destructive ml-0.5">●</span>}
                      {item.starred && <span className="text-[8px] text-amber-500 ml-0.5">★</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right area — resizable: Material | Actions */}
        {activeItem ? (
          <ResizablePanelGroup direction="horizontal" className="min-h-0">
            {/* Material panel */}
            <ResizablePanel defaultSize={55} minSize={30}>
              <div className="h-full overflow-y-auto p-6 bg-background/80">
                {/* Step type badge + nav */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {(() => { const m = TYPE_META[activeItem.type] || TYPE_META.read; const I = m.icon; return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-bold border ${m.color} bg-current/10`} style={{ background: 'transparent' }}>
                      <I size={12} className={m.color} />
                      <span className={m.color}>{m.label}</span>
                    </span>
                  ); })()}
                  <span className="text-[11px] text-muted-foreground">Шаг {activeIdx + 1} / {items.length}</span>
                  {activeItem.critical && <span className="text-[10px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-display font-bold border border-destructive/20">Критический</span>}
                  {activeItem.starred && <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-display font-bold border border-amber-500/20">★ Звёздочный</span>}
                </div>

                <h2 className="text-xl font-display font-bold text-foreground mb-5 leading-tight">{activeItem.title || 'Без заголовка'}</h2>

                {activeItem.content ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-body leading-relaxed text-foreground/90">
                    <RichTextViewer content={activeItem.content} />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <BookOpen size={24} className="text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-body text-muted-foreground/60">Материал для этого шага не добавлен</p>
                  </div>
                )}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Actions panel */}
            <ResizablePanel defaultSize={45} minSize={25}>
              <div className="h-full overflow-y-auto p-5 bg-card border-l-0 space-y-4">
                <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                  Задание и действия
                </p>

                {/* Task / assignment instructions from admin */}
                {activeItem.task && activeItem.task.replace(/<[^>]*>/g, '').trim() && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">📝 Задание</p>
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl prose prose-sm dark:prose-invert max-w-none">
                      <RichTextViewer content={activeItem.task} />
                    </div>
                  </div>
                )}

                {/* Student response field for write-type steps */}
                {employeeId && ['write', 'demo', 'clay_demo'].includes(activeItem.type) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Ваш ответ</p>
                      {answerSaving && <span className="text-[10px] text-muted-foreground animate-pulse">Сохранение...</span>}
                    </div>
                    <RichTextEditor
                      content={studentAnswers[activeItem.id] || ''}
                      onChange={(html) => {
                        setStudentAnswers(prev => ({ ...prev, [activeItem.id]: html }));
                        saveAnswer(activeItem.id, html);
                      }}
                      placeholder={activeItem.type === 'write' ? 'Напишите ваш ответ, эссе или конспект...' : 'Опишите вашу демонстрацию...'}
                      minHeight="150px"
                    />
                  </div>
                )}

                {/* Quiz */}
                {activeItem.type === 'quiz' && activeItem.quizQuestions && activeItem.quizQuestions.length > 0 && !isItemCompleted(activeItem.id) && (
                  <QuizStep
                    questions={activeItem.quizQuestions}
                    onPassed={() => completeMut.mutate(activeItem.id)}
                  />
                )}

                {/* Star rating widget */}
                {employeeId && activeItem.type === 'starrate' && !isItemCompleted(activeItem.id) && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Ваша оценка</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setStarRatings(prev => ({ ...prev, [activeItem.id]: n }))}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={n <= (starRatings[activeItem.id] ?? 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/30'}
                          />
                        </button>
                      ))}
                      {starRatings[activeItem.id] && (
                        <span className="text-xs text-muted-foreground font-body ml-1">
                          {starRatings[activeItem.id]} / 5
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => completeMut.mutate(activeItem.id)}
                      disabled={!starRatings[activeItem.id] || completeMut.isPending}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                    >
                      <Star size={16} /> Отправить оценку
                    </button>
                  </div>
                )}

                {/* Glossary hints for word_clearing steps */}
                {activeItem.type === 'word_clearing' && courseGlossary && courseGlossary.length > 0 && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-display font-bold text-cyan-700 dark:text-cyan-400 uppercase">Термины курса для прояснения</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {courseGlossary.slice(0, 6).map(t => (
                        <div key={t.id} className="bg-background rounded-lg p-2 border border-border">
                          <p className="text-xs font-display font-semibold text-foreground">{t.term}</p>
                          <p className="text-[10px] text-muted-foreground font-body line-clamp-2 mt-0.5">{t.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Clearing button */}
                {employeeId && (
                  <button onClick={() => setShowWordClearing(!showWordClearing)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1.5">
                    <HelpCircle size={14} /> {showWordClearing ? 'Скрыть прояснение слов' : 'Не понимаю слово'}
                  </button>
                )}

                {showWordClearing && employeeId && activeItem && (
                  <WordClearingPanel
                    courseId={courseId}
                    employeeId={employeeId}
                    stepId={activeItem.id}
                    onClose={() => setShowWordClearing(false)}
                    onWordChanged={() => qc.invalidateQueries({ queryKey: ['word-clearing-all', courseId, employeeId] })}
                  />
                )}

                {/* Twinning session notice */}
                {(() => {
                  const sessions = (myTwinning ?? []).filter(s => s.step_id === activeItem.id);
                  if (!sessions.length) return null;
                  return (
                    <div className="space-y-2">
                      {sessions.map(s => (
                        <div key={s.id} className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">↔</span>
                          <div>
                            <p className="text-xs font-display font-bold text-blue-700 dark:text-blue-400">Запланировано парное упражнение</p>
                            {s.scheduled_at && (
                              <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                                {new Date(s.scheduled_at).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {s.notes && <p className="text-[10px] text-muted-foreground font-body mt-0.5 italic">{s.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Artifact upload */}
                {employeeId && ['write', 'demo', 'clay_demo', 'drill'].includes(activeItem.type) && (
                  <StepArtifactUpload
                    courseId={courseId}
                    employeeId={employeeId}
                    stepId={activeItem.id}
                    onHasArtifact={setStepHasArtifact}
                  />
                )}

                {/* Checkout request */}
                {employeeId && activeBlocked.blocked && (activeItem.type === 'checkout' || activeItem.needsCheckout) && (
                  (() => {
                    const req = checkoutRequests?.find(r => r.step_id === activeItem.id);
                    if (!req) {
                      return <CheckoutRequestPanel courseId={courseId} employeeId={employeeId} stepId={activeItem.id} stepTitle={activeItem.title} onRequested={() => qc.invalidateQueries({ queryKey: ['checkout-requests'] })} />;
                    }
                    if (req.status === 'pending') {
                      return (
                        <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 flex items-center gap-2">
                          <Lock size={16} className="text-amber-500" />
                          <p className="text-xs font-display font-bold text-amber-700 dark:text-amber-400">Ожидает проверки супервизором</p>
                        </div>
                      );
                    }
                    if (req.status === 'rejected') {
                      return (
                        <div className="space-y-2">
                          <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4">
                            <p className="text-xs font-display font-bold text-destructive mb-1">Чек-аут не пройден</p>
                            {(req.result as any)?.notes && <p className="text-xs text-muted-foreground font-body">{(req.result as any).notes}</p>}
                          </div>
                          <CheckoutRequestPanel courseId={courseId} employeeId={employeeId} stepId={activeItem.id} stepTitle={activeItem.title} onRequested={() => qc.invalidateQueries({ queryKey: ['checkout-requests'] })} />
                        </div>
                      );
                    }
                    return null;
                  })()
                )}

                {/* Complete button */}
                {employeeId && !isItemCompleted(activeItem.id) && !activeBlocked.blocked && activeItem.type !== 'quiz' && activeItem.type !== 'starrate' && (() => {
                  const needsArtifact = ['demo', 'clay_demo'].includes(activeItem.type) && !stepHasArtifact;
                  return (
                    <div className="space-y-2">
                      {needsArtifact && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                          <span className="text-amber-500 text-sm">⚠</span>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-display font-bold">Загрузите артефакт для завершения шага</p>
                        </div>
                      )}
                      <button
                        onClick={() => completeMut.mutate(activeItem.id)}
                        disabled={completeMut.isPending || needsArtifact}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                      >
                        <Check size={16} /> Шаг выполнен
                      </button>
                    </div>
                  );
                })()}

                {isItemCompleted(activeItem.id) && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-display font-bold p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                    <Check size={16} /> Шаг выполнен
                  </div>
                )}

                {/* Step comments */}
                {employeeId && activeItem && (
                  <TrainingChat courseId={courseId} employeeId={employeeId} stepId={activeItem.id} mode="step_comment" />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="text-center py-12 bg-card">
            <p className="text-muted-foreground text-sm font-body">Контрольный лист пуст</p>
          </div>
        )}
      </div>

      {/* Floating chat with curator */}
      {employeeId && (
        <TrainingChat courseId={courseId} employeeId={employeeId} mode="chat" />
      )}

      {/* Floating video call button */}
      {employeeId && (
        <JitsiVideoCall courseId={courseId} employeeId={employeeId} courseName={course?.title} />
      )}
    </div>
  );
}
