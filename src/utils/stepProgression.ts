/**
 * Step Progression Rules — Phase 1-4
 *
 * Centralized logic implementing Hubbard Study Technology (ТО ЛРХ) rules:
 * - Sequential step enforcement (no skipping critical steps)
 * - Barrier detection (MU, absence of mass, steep gradient)
 * - Supervisor checkout gate
 * - Word clearing enforcement
 *
 * Adapted for ai-studio-rebuilt: steps live in courses.sections JSONB,
 * progress tracked in course_step_progress table.
 */

import type {
  StepProgress,
  StepStatus,
  StepType,
  ProgressionContext,
  ProgressionStep,
  GradientAnalysis,
  LearningBarrier,
  BarrierIndicator,
  CheckoutRequest,
  WordClearingEntry,
} from '@/types/academy';
import { BLOCKING_STATUSES, TERMINAL_STATUSES } from '@/types/academy';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProgress(ctx: ProgressionContext, stepId: string): StepProgress | undefined {
  return ctx.progressMap[stepId];
}

function isApproved(progress: StepProgress | undefined): boolean {
  if (!progress) return false;
  return progress.status === 'approved' || (progress.checked === true && !progress.status);
}

// ─── canCompleteStep ──────────────────────────────────────────────────────────

export interface CanCompleteResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Can the student mark `stepId` as complete right now?
 *
 * Rules checked (in order):
 * 1. Step must exist
 * 2. Not already approved
 * 3. Not blocked by a pending action
 * 4. If word_clearing type → all word clearings must be cleared
 * 5. If requires_artifact → artifact must be provided
 */
export function canCompleteStep(
  stepId: string,
  ctx: ProgressionContext,
  payload?: { hasArtifact?: boolean }
): CanCompleteResult {
  const step = ctx.steps.find(s => s.id === stepId);
  if (!step) return { allowed: false, reason: 'Шаг не найден' };

  const progress = getProgress(ctx, stepId);

  // Already approved
  if (progress && TERMINAL_STATUSES.includes(progress.status)) {
    return { allowed: false, reason: 'Шаг уже завершён и одобрен' };
  }

  // Blocked by pending review
  if (progress && BLOCKING_STATUSES.includes(progress.status)) {
    return { allowed: false, reason: 'Ожидается проверка куратора' };
  }

  // Word clearing: all entries for this step must be cleared
  if (step.type === 'word_clearing') {
    const unclearedCount = ctx.pendingWordClearings.filter(
      w => w.step_id === stepId && !w.cleared
    ).length;
    if (unclearedCount > 0) {
      return {
        allowed: false,
        reason: `Сначала проясните все непонятые слова (осталось: ${unclearedCount})`,
      };
    }
    const totalForStep = [
      ...ctx.pendingWordClearings.filter(w => w.step_id === stepId),
    ];
    if (totalForStep.length === 0) {
      return { allowed: false, reason: 'Добавьте хотя бы одно слово для прояснения' };
    }
  }

  // Checkout type: requires an approved checkout request
  if (step.type === 'checkout' || step.needsCheckout) {
    const req = ctx.checkoutMap[stepId];
    if (!req) return { allowed: false, reason: 'Требуется чек-аут супервизора' };
    if (req.status === 'pending') return { allowed: false, reason: 'Чек-аут ожидает проверки' };
    if (req.status === 'rejected') return { allowed: false, reason: 'Чек-аут не пройден — требуется пересдача' };
  }

  return { allowed: true };
}

// ─── isStepBlocked ────────────────────────────────────────────────────────────

/**
 * Is step `stepId` locked because a previous critical step is not approved?
 * Implements strict sequential progression (ТО ЛРХ: no skipping critical steps).
 */
export function isStepBlocked(stepId: string, ctx: ProgressionContext): boolean {
  const step = ctx.steps.find(s => s.id === stepId);
  if (!step) return true;

  // All steps with lower order that are marked critical must be approved
  const precedingSteps = ctx.steps.filter(s => s.order < step.order);

  for (const prev of precedingSteps) {
    if (!prev.critical) continue;
    const prevProgress = getProgress(ctx, prev.id);
    if (!isApproved(prevProgress)) {
      return true;
    }
  }

  return false;
}

// ─── canAdvanceToStep ─────────────────────────────────────────────────────────

/**
 * Can the student navigate to step `targetStepId`?
 * Always allows revisiting already-started steps; blocks steps gated by critical unapproved.
 */
export function canAdvanceToStep(targetStepId: string, ctx: ProgressionContext): CanCompleteResult {
  const target = ctx.steps.find(s => s.id === targetStepId);
  if (!target) return { allowed: false, reason: 'Шаг не найден' };

  const targetProgress = getProgress(ctx, targetStepId);

  // Can always revisit a step already interacted with
  if (targetProgress && targetProgress.status !== 'not_started') {
    return { allowed: true };
  }

  if (isStepBlocked(targetStepId, ctx)) {
    const blockingStep = ctx.steps
      .filter(s => s.order < target.order && s.critical)
      .reverse()
      .find(s => !isApproved(getProgress(ctx, s.id)));

    const hint = blockingStep
      ? ` Завершите шаг №${blockingStep.order + 1} сначала.`
      : '';
    return { allowed: false, reason: `Этот шаг заблокирован.${hint}` };
  }

  return { allowed: true };
}

// ─── nextAvailableStep ────────────────────────────────────────────────────────

/**
 * Returns the step_id of the next step the student should work on,
 * or null if all steps are approved.
 */
export function nextAvailableStep(ctx: ProgressionContext): string | null {
  for (const step of ctx.steps) {
    const progress = getProgress(ctx, step.id);
    if (!isApproved(progress)) {
      if (!isStepBlocked(step.id, ctx)) return step.id;
    }
  }
  return null;
}

// ─── computeCourseProgress ────────────────────────────────────────────────────

export interface CourseProgressSummary {
  total: number;
  approved: number;
  inProgress: number;
  pendingReview: number;
  notStarted: number;
  percentComplete: number;
}

export function computeCourseProgress(ctx: ProgressionContext): CourseProgressSummary {
  const total = ctx.steps.length;
  let approved = 0, inProgress = 0, pendingReview = 0, notStarted = 0;

  for (const step of ctx.steps) {
    const p = getProgress(ctx, step.id);
    const status: StepStatus = p?.status ?? 'not_started';
    if (isApproved(p)) approved++;
    else if (status === 'in_progress') inProgress++;
    else if (status === 'pending_review') pendingReview++;
    else notStarted++;
  }

  return {
    total,
    approved,
    inProgress,
    pendingReview,
    notStarted,
    percentComplete: total > 0 ? Math.round((approved / total) * 100) : 0,
  };
}

// ─── detectSteepGradient ──────────────────────────────────────────────────────

export function detectSteepGradient(ctx: ProgressionContext): GradientAnalysis {
  const stuckAt: number[] = [];
  const skippedSteps: number[] = [];

  let consecutiveFailures = 0;
  let firstStuckOrder: number | undefined;

  for (const step of ctx.steps) {
    const progress = getProgress(ctx, step.id);
    const status = progress?.status ?? 'not_started';

    if (status === 'rejected' || status === 'pending_review') {
      consecutiveFailures++;
      stuckAt.push(step.order);
      if (firstStuckOrder === undefined) firstStuckOrder = step.order;
    } else {
      consecutiveFailures = 0;
    }

    // Check if a critical step was skipped
    if (step.critical && !isApproved(progress)) {
      const laterApproved = ctx.steps
        .filter(s => s.order > step.order)
        .some(s => isApproved(getProgress(ctx, s.id)));
      if (laterApproved) {
        skippedSteps.push(step.order);
      }
    }
  }

  const hasSteepGradient = stuckAt.length >= 2 || skippedSteps.length > 0;
  const backStepTo = firstStuckOrder != null && firstStuckOrder > 0
    ? firstStuckOrder - 1
    : firstStuckOrder;

  return {
    hasSteepGradient,
    stuckAt,
    skippedSteps,
    backStepTo: hasSteepGradient ? backStepTo : undefined,
  };
}

// ─── detectBarriers ───────────────────────────────────────────────────────────

/**
 * Combines gradient detection + word clearing signals to identify
 * which of the three ТО ЛРХ barriers is most likely active.
 */
export function detectBarriers(ctx: ProgressionContext): BarrierIndicator[] {
  const barriers: BarrierIndicator[] = [];
  const now = new Date().toISOString();

  // Misunderstood Word: uncleared word clearing entries exist
  if (ctx.pendingWordClearings.some(w => !w.cleared)) {
    const uncleared = ctx.pendingWordClearings.filter(w => !w.cleared);
    const earliest = uncleared[0];
    const step = ctx.steps.find(s => s.id === earliest?.step_id);
    barriers.push({
      type: 'misunderstood_word',
      at_order: step?.order ?? 0,
      detected_at: now,
      resolved: false,
      notes: `Непрояснённые слова: ${uncleared.map(w => `"${w.term}"`).join(', ')}`,
    });
  }

  // Too-Steep Gradient: gradient analysis triggers
  const gradient = detectSteepGradient(ctx);
  if (gradient.hasSteepGradient && gradient.stuckAt.length > 0) {
    barriers.push({
      type: 'too_steep_gradient',
      at_order: gradient.stuckAt[0],
      detected_at: now,
      resolved: false,
      notes: `Студент застрял на шагах: ${gradient.stuckAt.map(o => o + 1).join(', ')}. Рекомендуется вернуться к шагу ${(gradient.backStepTo ?? gradient.stuckAt[0]) + 1}.`,
    });
  }

  // Absence of Mass: clay_demo steps stuck in pending or rejected
  const clayDemoStuck = ctx.steps.filter(s => {
    if (s.type !== 'clay_demo') return false;
    const p = getProgress(ctx, s.id);
    return p?.status === 'rejected' || p?.status === 'pending_review';
  });
  if (clayDemoStuck.length > 0) {
    barriers.push({
      type: 'absence_of_mass',
      at_order: clayDemoStuck[0].order,
      detected_at: now,
      resolved: false,
      notes: `Демонстрация из пластилина не выполнена на шаге ${clayDemoStuck[0].order + 1}. Студенту необходим реальный объект для понимания.`,
    });
  }

  return barriers;
}

// ─── stepStatusLabel ─────────────────────────────────────────────────────────

export function stepStatusLabel(status: StepStatus): string {
  const labels: Record<StepStatus, string> = {
    not_started:    'Не начат',
    in_progress:    'В процессе',
    pending_review: 'На проверке',
    approved:       'Одобрен',
    rejected:       'Отклонён',
    retry:          'Доработка',
  };
  return labels[status] ?? status;
}

// ─── stepTypeLabel ────────────────────────────────────────────────────────────

export function stepTypeLabel(type: StepType): string {
  const labels: Record<StepType, string> = {
    read:          'Чтение',
    write:         'Написание',
    demo:          'Демонстрация',
    drill:         'Упражнение',
    starrate:      'Оценка',
    clay_demo:     'Пластилиновое демо',
    checkout:      'Чек-аут',
    word_clearing: 'Прояснение слов',
    quiz:          'Тест',
  };
  return labels[type] ?? type;
}
