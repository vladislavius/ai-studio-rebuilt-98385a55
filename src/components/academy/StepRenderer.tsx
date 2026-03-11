/**
 * StepRenderer — Phase 2
 * Renders step content based on type (ТО ЛРХ).
 * Used inside CourseRoom.
 */

import React, { useState } from 'react';
import {
  BookOpen, PenLine, Eye, Dumbbell, Star, Sparkles,
  ClipboardCheck, Search, FileQuestion, HelpCircle,
  CheckCircle2, RotateCcw, Clock, AlertTriangle, Send,
} from 'lucide-react';
import { WordClearingPanel } from './WordClearingPanel';
import { StepArtifactUpload } from './StepArtifactUpload';
import { CheckoutRequestPanel } from './CheckoutRequestPanel';
import { QuizStep } from './QuizStep';
import { stepTypeLabel, canCompleteStep } from '@/utils/stepProgression';
import type {
  StepType, StepStatus, StepProgress,
  WordClearingEntry, CheckoutRequest, ProgressionContext,
} from '@/types/academy';

// ─── EnrichedStep interface ───────────────────────────────────────────────────

export interface EnrichedStep {
  step_id: string;          // from JSONB id field
  order: number;
  type: StepType;
  title: string;
  content: string;          // rich text material / instructions
  task?: string;            // additional task description
  critical?: boolean;
  needsCheckout?: boolean;
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
    correctIndices?: number[];
    multiSelect?: boolean;
  }[];
  // live data
  progress?: StepProgress;
}

// ─── TYPE_META ────────────────────────────────────────────────────────────────

const TYPE_META: Record<StepType, { icon: React.ElementType; color: string; bg: string }> = {
  read:          { icon: BookOpen,       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  write:         { icon: PenLine,        color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  demo:          { icon: Eye,            color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  drill:         { icon: Dumbbell,       color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-200' },
  starrate:      { icon: Star,           color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  clay_demo:     { icon: Sparkles,       color: 'text-teal-600',    bg: 'bg-teal-50 border-teal-200' },
  checkout:      { icon: ClipboardCheck, color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200' },
  word_clearing: { icon: Search,         color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200' },
  quiz:          { icon: FileQuestion,   color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StepRendererProps {
  step: EnrichedStep;
  courseId: string;
  employeeId: string;
  wordClearings: WordClearingEntry[];
  checkoutRequest?: CheckoutRequest | null;
  progressionCtx: ProgressionContext;
  onWordClearingsChange: () => void;
  onComplete: (payload?: { artifactUrl?: string; artifactName?: string }) => Promise<void>;
  onStartStep: () => Promise<void>;
  onSubmitCheckout: () => void;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StepRenderer({
  step,
  courseId,
  employeeId,
  wordClearings,
  checkoutRequest,
  progressionCtx,
  onWordClearingsChange,
  onComplete,
  onStartStep,
  onSubmitCheckout,
}: StepRendererProps) {
  const [completing, setCompleting] = useState(false);
  const [drillCount, setDrillCount] = useState(0);
  const [starRating, setStarRating] = useState(0);
  const [stepHasArtifact, setStepHasArtifact] = useState(false);

  const status: StepStatus = step.progress?.status ?? 'not_started';
  const meta = TYPE_META[step.type] ?? TYPE_META.read;
  const Icon = meta.icon;

  const canCheck = canCompleteStep(step.step_id, progressionCtx, { hasArtifact: stepHasArtifact });

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  };

  // ── Status banners ──────────────────────────────────────────────────────────

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-3 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-800">Шаг завершён и одобрен</p>
          <p className="text-sm text-emerald-700">Этот шаг успешно выполнен.</p>
        </div>
      </div>
    );
  }

  if (status === 'pending_review') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
          <Clock size={24} className="text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Ожидается проверка куратора</p>
            <p className="text-sm text-blue-700">Куратор проверит вашу работу и вынесет решение.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not started: show start button ─────────────────────────────────────────

  if (status === 'not_started') {
    return (
      <div className="space-y-4">
        <StepInstructions step={step} />
        <button
          onClick={onStartStep}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200"
        >
          <Icon size={16} /> Начать шаг
        </button>
      </div>
    );
  }

  // ── In progress / rejected / retry ─────────────────────────────────────────

  return (
    <div className="space-y-5">
      <StepInstructions step={step} />

      {/* Word clearing panel */}
      {step.type === 'word_clearing' && (
        <WordClearingPanel
          courseId={courseId}
          employeeId={employeeId}
          stepId={step.step_id}
          onClose={() => {}}
          onWordChanged={onWordClearingsChange}
        />
      )}

      {/* Drill counter */}
      {step.type === 'drill' && (
        <DrillCounter
          target={5}
          current={drillCount}
          onIncrement={() => setDrillCount(n => Math.min(n + 1, 5))}
          onReset={() => setDrillCount(0)}
        />
      )}

      {/* Star rating */}
      {step.type === 'starrate' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ваша оценка</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setStarRating(n)} className="transition-transform hover:scale-110">
                <Star
                  size={28}
                  className={n <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                />
              </button>
            ))}
            {starRating > 0 && (
              <span className="text-xs text-slate-500 ml-1">{starRating} / 5</span>
            )}
          </div>
        </div>
      )}

      {/* Quiz */}
      {step.type === 'quiz' && step.quizQuestions && step.quizQuestions.length > 0 && (
        <QuizStep
          questions={step.quizQuestions}
          onPassed={handleComplete}
        />
      )}

      {/* Artifact upload for demo / clay_demo types */}
      {['demo', 'clay_demo', 'write'].includes(step.type) && (
        <StepArtifactUpload
          courseId={courseId}
          employeeId={employeeId}
          stepId={step.step_id}
          onHasArtifact={setStepHasArtifact}
        />
      )}

      {/* Checkout panel */}
      {(step.type === 'checkout' || step.needsCheckout) && (
        (() => {
          if (!checkoutRequest) {
            return (
              <CheckoutRequestPanel
                courseId={courseId}
                employeeId={employeeId}
                stepId={step.step_id}
                stepTitle={step.title}
                onRequested={onSubmitCheckout}
              />
            );
          }
          if (checkoutRequest.status === 'pending') {
            return (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Чек-аут ожидает проверки супервизором</p>
              </div>
            );
          }
          if (checkoutRequest.status === 'rejected') {
            return (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700">Чек-аут не пройден — требуется пересдача</p>
                  {checkoutRequest.supervisor_notes && (
                    <p className="text-xs text-red-600 mt-1">{checkoutRequest.supervisor_notes}</p>
                  )}
                </div>
                <CheckoutRequestPanel
                  courseId={courseId}
                  employeeId={employeeId}
                  stepId={step.step_id}
                  stepTitle={step.title}
                  onRequested={onSubmitCheckout}
                />
              </div>
            );
          }
          return null;
        })()
      )}

      {/* Complete button — not shown for quiz (handled inside QuizStep), checkout, starrate */}
      {!['quiz', 'checkout', 'starrate'].includes(step.type) && !step.needsCheckout && (
        <div className="pt-2">
          {!canCheck.allowed && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">{canCheck.reason}</p>
            </div>
          )}
          <button
            onClick={handleComplete}
            disabled={!canCheck.allowed || completing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-200"
          >
            {completing ? (
              <><RotateCcw size={16} className="animate-spin" /> Сохраняю...</>
            ) : (
              <><CheckCircle2 size={16} /> Отметить как выполненное</>
            )}
          </button>
        </div>
      )}

      {/* Starrate complete button */}
      {step.type === 'starrate' && (
        <button
          onClick={handleComplete}
          disabled={starRating === 0 || completing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Star size={16} /> Отправить оценку
        </button>
      )}
    </div>
  );
}

// ─── StepInstructions ─────────────────────────────────────────────────────────

function StepInstructions({ step }: { step: EnrichedStep }) {
  const meta = TYPE_META[step.type] ?? TYPE_META.read;
  const Icon = meta.icon;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit text-xs font-semibold ${meta.bg} ${meta.color}`}>
        <Icon size={12} />
        {stepTypeLabel(step.type)}
      </div>

      <h3 className="text-slate-800 font-semibold leading-relaxed">{step.title}</h3>

      {/* Rich text content */}
      {step.content && (
        <div
          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: step.content }}
        />
      )}

      {/* Task instructions */}
      {step.task && step.task.replace(/<[^>]*>/g, '').trim() && (
        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">Задание:</p>
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: step.task }}
          />
        </div>
      )}

      {step.critical && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle size={12} />
          <span>Критический шаг — обязателен для перехода дальше</span>
        </div>
      )}
    </div>
  );
}

// ─── DrillCounter ─────────────────────────────────────────────────────────────

function DrillCounter({
  target,
  current,
  onIncrement,
  onReset,
}: {
  target: number;
  current: number;
  onIncrement: () => void;
  onReset: () => void;
}) {
  const pct = Math.round((current / target) * 100);
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-purple-800">Счётчик повторений</p>
        <span className="text-sm font-bold text-purple-600">{current} / {target}</span>
      </div>
      <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onIncrement}
          disabled={current >= target}
          className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          + Выполнено
        </button>
        <button
          onClick={onReset}
          disabled={current === 0}
          className="px-3 py-2 bg-white border border-purple-200 text-purple-600 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {current >= target && (
        <p className="text-xs text-purple-700 font-semibold text-center">
          Все {target} повторений выполнены!
        </p>
      )}
    </div>
  );
}
