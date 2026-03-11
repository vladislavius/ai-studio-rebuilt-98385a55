/**
 * CheckoutPanel — Phase 3
 * Supervisor views a student's checkout request, asks questions,
 * then approves, requests retry, or rejects.
 *
 * Uses ai-studio-rebuilt's checkout_requests schema:
 *   step_id TEXT, supervisor_notes TEXT, questions JSONB, status TEXT
 */

import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, RotateCcw, User,
  MessageSquare, FileText, ExternalLink, ChevronDown, ChevronUp, Send,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { stepTypeLabel } from '@/utils/stepProgression';
import type { CheckoutRequest, CheckoutQuestion, StepType } from '@/types/academy';

export interface CheckoutItem {
  request: CheckoutRequest;
  studentName: string;
  courseTitle: string;
  stepTitle: string;
  stepType: StepType;
  stepOrder: number;
  artifactUrl?: string | null;
  artifactName?: string | null;
}

interface CheckoutPanelProps {
  item: CheckoutItem;
  onResolved: (requestId: string, newStatus: 'approved' | 'rejected' | 'retry') => void;
}

export function CheckoutPanel({ item, onResolved }: CheckoutPanelProps) {
  const qc = useQueryClient();
  const { request } = item;
  const [note, setNote] = useState(request.supervisor_notes ?? '');
  const [extraQ, setExtraQ] = useState('');
  const [questions, setQuestions] = useState<CheckoutQuestion[]>(request.questions ?? []);
  const [expanded, setExpanded] = useState(true);

  const resolveMut = useMutation({
    mutationFn: async (status: 'approved' | 'rejected' | 'retry') => {
      const now = new Date().toISOString();

      // Update checkout_requests
      const { error: crErr } = await supabase
        .from('checkout_requests')
        .update({
          status,
          supervisor_notes: note || null,
          questions,
          reviewed_at: now,
        })
        .eq('id', request.id);
      if (crErr) throw crErr;

      // Update course_step_progress status
      const newStepStatus =
        status === 'approved' ? 'approved' :
        status === 'rejected' ? 'rejected' :
        'in_progress'; // retry → let student redo

      const { error: spErr } = await supabase
        .from('course_step_progress')
        .update({
          status: newStepStatus,
          checked: status === 'approved',
          checked_at: status === 'approved' ? now : null,
          curator_notes: note || null,
        })
        .eq('course_id', request.course_id)
        .eq('employee_id', request.employee_id)
        .eq('step_id', request.step_id);
      if (spErr) throw spErr;

      return status;
    },
    onSuccess: (status) => {
      toast.success(
        status === 'approved' ? 'Одобрено' :
        status === 'retry'    ? 'Отправлено на доработку' :
        'Отклонено'
      );
      qc.invalidateQueries({ queryKey: ['checkout-requests'] });
      qc.invalidateQueries({ queryKey: ['step-progress'] });
      onResolved(request.id, status);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addQuestion = () => {
    if (!extraQ.trim()) return;
    setQuestions(q => [...q, { question: extraQ.trim(), answer: '' }]);
    setExtraQ('');
  };

  const isPending = request.status === 'pending';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{item.studentName}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 truncate">{item.courseTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              Шаг {item.stepOrder + 1}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${stepTypeBadge(item.stepType)}`}>
              {stepTypeLabel(item.stepType)}
            </span>
            <span className="text-xs text-slate-500 truncate">{item.stepTitle}</span>
          </div>
        </div>
        <StatusBadge status={request.status} />
        {expanded
          ? <ChevronUp size={14} className="text-slate-400 shrink-0" />
          : <ChevronDown size={14} className="text-slate-400 shrink-0" />
        }
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Artifact */}
          {item.artifactUrl && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-3">
              <FileText size={16} className="text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-700">{item.artifactName ?? 'Файл'}</p>
                <a
                  href={item.artifactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline truncate block"
                >
                  Открыть <ExternalLink size={10} className="inline" />
                </a>
              </div>
            </div>
          )}

          {/* Q&A */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <MessageSquare size={11} /> Вопросы и ответы
              </p>
              {questions.map((qa, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">В: {qa.question}</p>
                  {qa.answer && <p className="text-xs text-slate-500 mt-0.5">О: {qa.answer}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Add extra question (only if pending) */}
          {isPending && (
            <div className="flex gap-2">
              <input
                type="text"
                value={extraQ}
                onChange={e => setExtraQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuestion()}
                placeholder="Добавить вопрос студенту..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={addQuestion}
                disabled={!extraQ.trim()}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <Send size={13} />
              </button>
            </div>
          )}

          {/* Supervisor note */}
          {isPending && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Комментарий куратора
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Причина решения, рекомендации..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => resolveMut.mutate('approved')}
                disabled={resolveMut.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                <CheckCircle2 size={15} /> Одобрить
              </button>
              <button
                onClick={() => resolveMut.mutate('retry')}
                disabled={resolveMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-200 disabled:opacity-40 transition-colors"
              >
                <RotateCcw size={14} /> Доработать
              </button>
              <button
                onClick={() => resolveMut.mutate('rejected')}
                disabled={resolveMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-40 transition-colors"
              >
                <XCircle size={14} /> Отклонить
              </button>
            </div>
          )}

          {/* Resolved state */}
          {!isPending && request.supervisor_notes && (
            <div className={`p-3 rounded-xl border ${
              request.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs font-semibold text-slate-600 mb-1">Решение куратора:</p>
              <p className="text-sm text-slate-700">{request.supervisor_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'На проверке', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
    approved: { label: 'Одобрено',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    rejected: { label: 'Отклонено',   cls: 'bg-red-100 text-red-600 border-red-200' },
    retry:    { label: 'Доработка',   cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const c = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${c.cls}`}>
      {c.label}
    </span>
  );
}

function stepTypeBadge(type: StepType): string {
  const m: Record<StepType, string> = {
    read:          'bg-blue-100 text-blue-700',
    write:         'bg-amber-100 text-amber-700',
    demo:          'bg-emerald-100 text-emerald-700',
    drill:         'bg-purple-100 text-purple-700',
    starrate:      'bg-orange-100 text-orange-700',
    clay_demo:     'bg-teal-100 text-teal-700',
    checkout:      'bg-rose-100 text-rose-700',
    word_clearing: 'bg-cyan-100 text-cyan-700',
    quiz:          'bg-indigo-100 text-indigo-700',
  };
  return m[type] ?? 'bg-slate-100 text-slate-600';
}
