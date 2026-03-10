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

interface ChecksheetItem {
  id: string;
  order: number;
  type: 'read' | 'write' | 'demo' | 'drill' | 'starrate' | 'clay_demo' | 'checkout' | 'word_clearing' | 'quiz';
  title: string;
  content: string;
  critical?: boolean;
  needsCheckout?: boolean;
  starred?: boolean;
  quizQuestions?: { question: string; options: string[]; correctIndex: number }[];
}

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  read: { label: 'Прочитать', icon: BookOpen, color: 'text-blue-500' },
  write: { label: 'Написать', icon: PenLine, color: 'text-amber-500' },
  demo: { label: 'Демо', icon: Eye, color: 'text-emerald-500' },
  clay_demo: { label: 'Глиняное демо', icon: Sparkles, color: 'text-teal-500' },
  drill: { label: 'Упражнение', icon: Dumbbell, color: 'text-purple-500' },
  checkout: { label: 'Чек-аут', icon: ClipboardCheck, color: 'text-rose-500' },
  word_clearing: { label: 'Прояснение слов', icon: Search, color: 'text-cyan-500' },
  starrate: { label: 'Звёздная оценка', icon: Star, color: 'text-orange-500' },
  quiz: { label: 'Тест', icon: FileQuestion, color: 'text-indigo-500' },
};

interface Props {
  courseId: string;
  onBack: () => void;
  employeeId?: string;
}

export function CourseStudyView({ courseId, onBack, employeeId }: Props) {
  const qc = useQueryClient();
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [showWordClearing, setShowWordClearing] = useState(false);

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

  const items: ChecksheetItem[] = course && Array.isArray(course.sections)
    ? (course.sections as unknown as ChecksheetItem[]).sort((a, b) => a.order - b.order)
    : [];

  useEffect(() => {
    if (progressRecord?.completed_sections && Array.isArray(progressRecord.completed_sections)) {
      setCompletedIds(progressRecord.completed_sections as string[]);
      const completed = new Set(progressRecord.completed_sections as string[]);
      const firstIncomplete = items.findIndex(it => !completed.has(it.id));
      if (firstIncomplete >= 0) setActiveIdx(firstIncomplete);
    }
  }, [progressRecord, items.length]);

  const completeMut = useMutation({
    mutationFn: async (itemId: string) => {
      if (!employeeId || !progressRecord) return;
      const newCompleted = [...completedIds, itemId];
      const percent = Math.round((newCompleted.length / items.length) * 100);
      const isComplete = percent >= 100;
      const { error } = await supabase.from('course_progress').update({
        completed_sections: newCompleted,
        progress_percent: percent,
        ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
      }).eq('id', progressRecord.id);
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

  // Check if step is blocked (checkout type or needsCheckout, and no approved checkout)
  const isStepBlocked = (item: ChecksheetItem): { blocked: boolean; reason: string } => {
    if ((item.type === 'checkout' || item.needsCheckout) && employeeId) {
      const req = checkoutRequests?.find(r => r.step_id === item.id);
      if (!req) return { blocked: true, reason: 'Требуется чек-аут супервизора' };
      if (req.status === 'pending') return { blocked: true, reason: 'Чек-аут ожидает проверки' };
      if (req.status === 'rejected') return { blocked: true, reason: 'Чек-аут не пройден — пересдача' };
      // approved — not blocked
    }
    return { blocked: false, reason: '' };
  };

  const activeBlocked = activeItem ? isStepBlocked(activeItem) : { blocked: false, reason: '' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-bold text-foreground truncate">{course?.title || 'Загрузка...'}</h1>
          <p className="text-xs text-muted-foreground font-body">{completedIds.length} / {items.length} пунктов выполнено</p>
        </div>
        {allComplete && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold">
            <Award size={14} /> Завершён
          </div>
        )}
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* Certificate */}
      {allComplete && progressRecord?.completed_at && course && (
        <CourseCertificate
          courseName={course.title}
          employeeName={employee?.full_name || '—'}
          completedAt={progressRecord.completed_at}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Контрольный лист</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.map((item, idx) => {
              const meta = TYPE_META[item.type] || TYPE_META.read;
              const Icon = meta.icon;
              const done = isItemCompleted(item.id);
              const isActive = idx === activeIdx;
              const blocked = isStepBlocked(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left p-3 flex items-start gap-2.5 border-b border-border/50 transition-colors ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/50'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-primary text-primary-foreground' : blocked.blocked ? 'border border-amber-500 bg-amber-500/10' : 'border border-border'}`}>
                    {done ? <Check size={12} /> : blocked.blocked ? <Lock size={10} className="text-amber-500" /> : <span className="text-[10px] text-muted-foreground">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={`text-xs font-body leading-tight ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.title || 'Без заголовка'}</p>
                      {item.critical && <span className="text-[8px] text-destructive">🔴</span>}
                      {item.starred && <span className="text-[8px] text-amber-500">⭐</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Icon size={10} className={meta.color} />
                      <span className="text-[10px] text-muted-foreground">{meta.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="bg-card border border-border rounded-xl p-6">
          {activeItem ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(() => { const m = TYPE_META[activeItem.type] || TYPE_META.read; const I = m.icon; return <I size={18} className={m.color} />; })()}
                <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">
                  {TYPE_META[activeItem.type]?.label || activeItem.type}
                </span>
                <span className="text-[10px] text-muted-foreground">• Пункт {activeIdx + 1} из {items.length}</span>
                {activeItem.critical && <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-display font-bold">Критический</span>}
                {activeItem.starred && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded font-display font-bold">⭐ Звёздочный</span>}
              </div>

              <h2 className="text-lg font-display font-bold text-foreground">{activeItem.title || 'Без заголовка'}</h2>

              {activeItem.content && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <RichTextViewer content={activeItem.content} />
                </div>
              )}

              {/* Student response field for write-type steps */}
              {employeeId && ['write', 'demo', 'clay_demo'].includes(activeItem.type) && !isItemCompleted(activeItem.id) && (
                <div className="space-y-2">
                  <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Ваш ответ</p>
                  <RichTextEditor
                    content=""
                    onChange={() => {}}
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

              {/* Word Clearing button */}
              {employeeId && (
                <button onClick={() => setShowWordClearing(!showWordClearing)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-display font-bold text-muted-foreground hover:bg-accent flex items-center gap-1.5">
                  <HelpCircle size={14} /> {showWordClearing ? 'Скрыть прояснение слов' : 'Не понимаю слово'}
                </button>
              )}

              {showWordClearing && employeeId && activeItem && (
                <WordClearingPanel courseId={courseId} employeeId={employeeId} stepId={activeItem.id} onClose={() => setShowWordClearing(false)} />
              )}

              {/* Artifact upload */}
              {employeeId && ['write', 'demo', 'clay_demo', 'drill'].includes(activeItem.type) && (
                <StepArtifactUpload courseId={courseId} employeeId={employeeId} stepId={activeItem.id} />
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
              {employeeId && !isItemCompleted(activeItem.id) && !activeBlocked.blocked && activeItem.type !== 'quiz' && (
                <button
                  onClick={() => completeMut.mutate(activeItem.id)}
                  disabled={completeMut.isPending}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Check size={16} /> Выполнено ✓
                </button>
              )}

              {isItemCompleted(activeItem.id) && (
                <div className="flex items-center gap-2 text-primary text-sm font-display font-bold">
                  <Check size={16} /> Пункт выполнен
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm font-body">Контрольный лист пуст</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
