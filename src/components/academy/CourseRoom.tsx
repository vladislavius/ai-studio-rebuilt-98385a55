/**
 * CourseRoom — Phase 2
 * Main course study screen implementing ТО ЛРХ strict sequential progression.
 *
 * Layout:
 *   - Left: step list (status, type, lock state)
 *   - Right: active step (StepRenderer)
 *   - Mobile: toggle between list and content
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Circle, Lock, Clock,
  AlertTriangle, GraduationCap, ChevronRight, List, BookOpen,
  Loader2, XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StepRenderer, type EnrichedStep } from './StepRenderer';
import {
  canAdvanceToStep, isStepBlocked, nextAvailableStep,
  computeCourseProgress, detectBarriers, stepTypeLabel, stepStatusLabel,
} from '@/utils/stepProgression';
import type {
  StepProgress, StepStatus, WordClearingEntry,
  CheckoutRequest, ProgressionContext,
} from '@/types/academy';
import type { AppRole } from '@/hooks/useAuth';

interface CourseRoomProps {
  courseId: string;
  employeeId: string;
  userRoles: AppRole[];
  onBack: () => void;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusIcon({ status, blocked }: { status: StepStatus; blocked: boolean }) {
  if (blocked) return <Lock size={14} className="text-slate-300" />;
  if (status === 'approved') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'pending_review') return <Clock size={14} className="text-blue-400" />;
  if (status === 'rejected') return <XCircle size={14} className="text-red-400" />;
  if (status === 'in_progress') return <div className="w-3 h-3 rounded-full bg-amber-400" />;
  return <Circle size={14} className="text-slate-300" />;
}

function stepRowClass(active: boolean, status: StepStatus, blocked: boolean) {
  if (active) return 'bg-amber-50 border-l-2 border-amber-500';
  if (blocked) return 'opacity-50 cursor-not-allowed';
  if (status === 'approved') return 'opacity-70 cursor-pointer hover:bg-slate-50';
  return 'hover:bg-slate-50 cursor-pointer';
}

// ─── Main component ────────────────────────────────────────────────────────────

export function CourseRoom({ courseId, employeeId, userRoles, onBack }: CourseRoomProps) {
  const qc = useQueryClient();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'step'>('list');

  // ── Load course ──────────────────────────────────────────────────────────────

  const { data: course, isLoading: loadingCourse, error: courseError } = useQuery({
    queryKey: ['course-room', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Parse steps from JSONB — remap `id` → `step_id` (JSONB key vs EnrichedStep field)
  const steps: EnrichedStep[] = useMemo(() => {
    if (!course?.sections || !Array.isArray(course.sections)) return [];
    return (course.sections as any[])
      .map(s => ({ ...s, step_id: s.id ?? s.step_id }))
      .sort((a, b) => a.order - b.order) as EnrichedStep[];
  }, [course]);

  // ── Load step progress ────────────────────────────────────────────────────────

  const { data: progressRows } = useQuery({
    queryKey: ['step-progress', courseId, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_step_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return data as StepProgress[];
    },
    enabled: !!courseId && !!employeeId,
  });

  const progressMap: Record<string, StepProgress> = useMemo(() => {
    const map: Record<string, StepProgress> = {};
    for (const p of progressRows ?? []) {
      map[p.step_id] = p;
    }
    return map;
  }, [progressRows]);

  // ── Load checkout requests ────────────────────────────────────────────────────

  const { data: checkoutRows } = useQuery({
    queryKey: ['checkout-requests', courseId, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_requests')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return data as CheckoutRequest[];
    },
    enabled: !!courseId && !!employeeId,
  });

  const checkoutMap: Record<string, CheckoutRequest> = useMemo(() => {
    const map: Record<string, CheckoutRequest> = {};
    for (const c of checkoutRows ?? []) {
      map[c.step_id] = { ...c, questions: (c.questions as any[]) ?? [] };
    }
    return map;
  }, [checkoutRows]);

  // ── Load word clearings ───────────────────────────────────────────────────────

  const { data: wordClearingRows } = useQuery({
    queryKey: ['word-clearings', courseId, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('word_clearing_logs')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', employeeId);
      if (error) throw error;
      return data as WordClearingEntry[];
    },
    enabled: !!courseId && !!employeeId,
  });

  const pendingWordClearings = useMemo(
    () => (wordClearingRows ?? []).filter(w => !w.cleared),
    [wordClearingRows]
  );

  // ── Build ProgressionContext ──────────────────────────────────────────────────

  const ctx: ProgressionContext = useMemo(() => ({
    steps: steps.map(s => ({
      id: s.step_id,
      order: s.order,
      type: s.type,
      critical: s.critical,
      needsCheckout: s.needsCheckout,
    })),
    progressMap,
    checkoutMap,
    pendingWordClearings,
    userRoles,
  }), [steps, progressMap, checkoutMap, pendingWordClearings, userRoles]);

  const summary = useMemo(() => computeCourseProgress(ctx), [ctx]);
  const barriers = useMemo(() => detectBarriers(ctx), [ctx]);

  // Auto-select initial step (only once steps load)
  const initialStepSelected = React.useRef(false);
  React.useEffect(() => {
    if (steps.length > 0 && !initialStepSelected.current && !activeStepId) {
      initialStepSelected.current = true;
      const next = nextAvailableStep(ctx);
      setActiveStepId(next ?? steps[0]?.step_id ?? null);
    }
  }, [steps, ctx, activeStepId]);

  const activeStep = steps.find(s => s.step_id === activeStepId);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const invalidateProgress = () => {
    qc.invalidateQueries({ queryKey: ['step-progress', courseId, employeeId] });
    qc.invalidateQueries({ queryKey: ['my-course-progress', courseId] });
  };

  const startMut = useMutation({
    mutationFn: async (stepId: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from('course_step_progress').upsert({
        course_id: courseId,
        employee_id: employeeId,
        step_id: stepId,
        status: 'in_progress',
        started_at: now,
      }, { onConflict: 'course_id,employee_id,step_id' });
      if (error) throw error;
    },
    onSuccess: invalidateProgress,
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: async ({
      stepId,
      step,
    }: {
      stepId: string;
      step: EnrichedStep;
    }) => {
      const needsReview = step.type === 'checkout' || step.needsCheckout;
      const newStatus = needsReview ? 'pending_review' : 'approved';
      const now = new Date().toISOString();

      const { error } = await supabase.from('course_step_progress').upsert({
        course_id: courseId,
        employee_id: employeeId,
        step_id: stepId,
        status: newStatus,
        checked: !needsReview,
        checked_at: !needsReview ? now : null,
        completed_at: now,
      }, { onConflict: 'course_id,employee_id,step_id' });
      if (error) throw error;

      // Update course-level progress
      if (!needsReview) {
        const allStepIds = steps.map(s => s.step_id);
        const currentCompleted = Object.entries(progressMap)
          .filter(([, p]) => p.status === 'approved')
          .map(([id]) => id);
        const newCompleted = Array.from(new Set([...currentCompleted, stepId]));
        const pct = Math.round((newCompleted.length / allStepIds.length) * 100);

        await supabase.from('course_progress').upsert({
          course_id: courseId,
          employee_id: employeeId,
          progress_percent: pct,
          completed_sections: newCompleted,
          ...(pct >= 100 ? { completed_at: now } : {}),
        }, { onConflict: 'course_id,employee_id' });
      }

      return { needsReview };
    },
    onSuccess: ({ needsReview }, { stepId }) => {
      invalidateProgress();
      if (!needsReview) {
        toast.success('Шаг выполнен');
        // Auto-advance
        const updatedProgressMap = {
          ...progressMap,
          [stepId]: { ...progressMap[stepId], status: 'approved' as const, step_id: stepId } as StepProgress,
        };
        const updatedCtx = { ...ctx, progressMap: updatedProgressMap };
        const next = nextAvailableStep(updatedCtx);
        if (next) {
          setActiveStepId(next);
          setMobileView('step');
        }
      } else {
        toast.success('Отправлено на проверку');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleStartStep = async () => {
    if (!activeStepId) return;
    await startMut.mutateAsync(activeStepId);
  };

  const handleComplete = async () => {
    if (!activeStepId || !activeStep) return;
    await completeMut.mutateAsync({ stepId: activeStepId, step: activeStep });
  };

  const handleSelectStep = (step: EnrichedStep) => {
    const result = canAdvanceToStep(step.step_id, ctx);
    if (!result.allowed) {
      toast.error(result.reason ?? 'Шаг заблокирован');
      return;
    }
    setActiveStepId(step.step_id);
    setMobileView('step');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (courseError) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertTriangle size={40} className="text-red-400" />
        <p className="text-slate-700 font-medium">Ошибка загрузки курса</p>
        <button onClick={onBack} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600">
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <button onClick={onBack} className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 truncate">{course?.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${summary.percentComplete}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              {summary.approved}/{summary.total} шагов
            </span>
          </div>
        </div>

        {/* Mobile view toggle */}
        <div className="flex md:hidden gap-1">
          <button
            onClick={() => setMobileView('list')}
            className={`p-1.5 rounded-lg transition-colors ${mobileView === 'list' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setMobileView('step')}
            className={`p-1.5 rounded-lg transition-colors ${mobileView === 'step' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <BookOpen size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Step list sidebar ───────────────────────────────────────────────── */}
        <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-72 shrink-0 flex-col bg-white border-r border-slate-200 overflow-y-auto`}>
          {/* Barrier alerts */}
          {barriers.length > 0 && (
            <div className="p-3 border-b border-amber-200 bg-amber-50">
              {barriers.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{b.notes}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1">
            {steps.map((step, idx) => {
              const prog = progressMap[step.step_id];
              const status: StepStatus = prog?.status ?? 'not_started';
              const blocked = isStepBlocked(step.step_id, ctx);
              const isActive = step.step_id === activeStepId;

              return (
                <div
                  key={step.step_id}
                  onClick={() => !blocked && handleSelectStep(step)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 transition-colors ${stepRowClass(isActive, status, blocked)}`}
                >
                  <div className="shrink-0">
                    <StatusIcon status={status} blocked={blocked} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-amber-700' : blocked ? 'text-slate-400' : 'text-slate-700'}`}>
                      {idx + 1}. {step.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stepTypeLabel(step.type)}</p>
                  </div>
                  {isActive && <ChevronRight size={12} className="text-amber-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Active step content ─────────────────────────────────────────────── */}
        <main className={`${mobileView === 'step' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-y-auto bg-slate-50`}>
          {activeStep ? (
            <div className="p-5 max-w-2xl mx-auto w-full">
              {/* Step header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <GraduationCap size={12} />
                  <span>Шаг {activeStep.order + 1} из {steps.length}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  progressMap[activeStep.step_id]?.status === 'approved'       ? 'bg-emerald-100 text-emerald-700' :
                  progressMap[activeStep.step_id]?.status === 'pending_review' ? 'bg-blue-100 text-blue-700' :
                  progressMap[activeStep.step_id]?.status === 'in_progress'    ? 'bg-amber-100 text-amber-700' :
                  progressMap[activeStep.step_id]?.status === 'rejected'       ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {stepStatusLabel(progressMap[activeStep.step_id]?.status ?? 'not_started')}
                </span>
              </div>

              <StepRenderer
                step={{ ...activeStep, progress: progressMap[activeStep.step_id] }}
                courseId={courseId}
                employeeId={employeeId}
                wordClearings={(wordClearingRows ?? []).filter(w => w.step_id === activeStep.step_id)}
                checkoutRequest={checkoutMap[activeStep.step_id]}
                progressionCtx={ctx}
                onWordClearingsChange={() => {
                  qc.invalidateQueries({ queryKey: ['word-clearings', courseId, employeeId] });
                }}
                onComplete={handleComplete}
                onStartStep={handleStartStep}
                onSubmitCheckout={() => {
                  qc.invalidateQueries({ queryKey: ['checkout-requests', courseId, employeeId] });
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3">
              <BookOpen size={40} className="opacity-30" />
              <p className="text-sm">Выберите шаг слева</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
