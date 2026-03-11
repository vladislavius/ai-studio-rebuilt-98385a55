/**
 * Academy Domain Types — Phase 1-4
 * Strict TypeScript types for roles, step progression, barriers, and enforcement rules.
 * Adapted for ai-studio-rebuilt architecture (steps in courses.sections JSONB).
 */

import type { AppRole } from '@/hooks/useAuth';

// ─── Re-export AppRole as AcademyRole for convenience ─────────────────────────

export type { AppRole };
export type AcademyRole = AppRole;

// ─── Step Types ───────────────────────────────────────────────────────────────

export type StepType =
  | 'read'
  | 'write'
  | 'demo'
  | 'drill'
  | 'starrate'
  | 'clay_demo'
  | 'checkout'
  | 'word_clearing'
  | 'quiz';

/** Steps that require supervisor checkout before the student can mark complete */
export const CHECKOUT_STEP_TYPES: StepType[] = ['checkout'];

/** Steps that block progression until word clearing is complete */
export const WORD_CLEARING_STEP_TYPES: StepType[] = ['word_clearing'];

// ─── Step Enforcement Flags ───────────────────────────────────────────────────

/**
 * Enforcement flags stored in step JSONB within courses.sections.
 * Maps directly to ChecksheetItem fields in the DB.
 */
export interface StepEnforcement {
  critical?: boolean;        // blocks next steps until approved
  needsCheckout?: boolean;   // requires supervisor checkout
  requires_artifact?: boolean;
  estimated_minutes?: number;
}

// ─── Step Status ──────────────────────────────────────────────────────────────

export type StepStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'retry';

/** States where student cannot self-complete */
export const BLOCKING_STATUSES: StepStatus[] = ['pending_review'];

/** Terminal states — student cannot re-attempt without curator action */
export const TERMINAL_STATUSES: StepStatus[] = ['approved'];

// ─── Step Progress Record ─────────────────────────────────────────────────────

/** Row from course_step_progress table */
export interface StepProgress {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;         // references ChecksheetItem.id (text)
  status: StepStatus;
  artifact_url?: string | null;
  artifact_name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  checked: boolean;
  checked_at?: string | null;
  curator_notes?: string | null;
  created_at: string;
}

// ─── Barriers of Learning (ТО ЛРХ) ───────────────────────────────────────────

export type LearningBarrier =
  | 'misunderstood_word'   // Непонятое слово
  | 'absence_of_mass'      // Отсутствие масса (нет реального объекта)
  | 'too_steep_gradient';  // Слишком крутой градиент (пропущен предыдущий материал)

export interface BarrierIndicator {
  type: LearningBarrier;
  /** Step order number where barrier was detected */
  at_order: number;
  detected_at: string;
  resolved: boolean;
  notes?: string;
}

export interface GradientAnalysis {
  hasSteepGradient: boolean;
  stuckAt: number[];
  skippedSteps: number[];
  backStepTo?: number;
}

// ─── Checkout Request ─────────────────────────────────────────────────────────

export type CheckoutStatus = 'pending' | 'approved' | 'rejected' | 'retry';

export interface CheckoutQuestion {
  question: string;
  answer: string;
}

/** Row from checkout_requests table in ai-studio-rebuilt */
export interface CheckoutRequest {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;          // TEXT — references ChecksheetItem.id
  status: CheckoutStatus;
  supervisor_notes?: string | null;
  questions: CheckoutQuestion[];
  result?: Record<string, unknown> | null;
  requested_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

// ─── Word Clearing Log ────────────────────────────────────────────────────────

/** Row from word_clearing_logs table */
export interface WordClearingEntry {
  id: string;
  course_id: string;
  employee_id: string;
  step_id: string;
  term: string;
  definition?: string | null;
  example?: string | null;
  cleared: boolean;
  created_at: string;
}

// ─── Progression Context ──────────────────────────────────────────────────────

/** Step shape as used in ProgressionContext */
export interface ProgressionStep {
  id: string;
  order: number;
  type: StepType;
  critical?: boolean;
  needsCheckout?: boolean;
}

export interface ProgressionContext {
  /** All steps in the course in order */
  steps: ProgressionStep[];
  /** Per-step progress map: step_id → StepProgress */
  progressMap: Record<string, StepProgress>;
  /** Checkout requests map: step_id → CheckoutRequest */
  checkoutMap: Record<string, CheckoutRequest>;
  /** Uncleared word clearing entries */
  pendingWordClearings: WordClearingEntry[];
  /** Roles of the current user */
  userRoles: AcademyRole[];
}
