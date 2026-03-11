/**
 * CheckoutReviewPanel — куратор просматривает все checkout_requests.
 * Использует CheckoutPanel (Phase 3) для каждой заявки.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck } from 'lucide-react';
import { CheckoutPanel } from './CheckoutPanel';
import type { CheckoutRequest, StepType } from '@/types/academy';

export function CheckoutReviewPanel() {
  const qc = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['checkout-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkout_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CheckoutRequest[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title, sections');
      if (error) throw error;
      return data ?? [];
    },
  });

  const empMap   = new Map(employees?.map(e => [e.id, e.full_name]) ?? []);
  const courseMap = new Map(courses?.map(c => [c.id, c]) ?? []);

  const getStepMeta = (courseId: string, stepId: string): { title: string; type: StepType; order: number } => {
    const course = courseMap.get(courseId);
    const sections = Array.isArray(course?.sections) ? (course.sections as any[]) : [];
    const step = sections.find((s: any) => s.id === stepId);
    return {
      title: step?.title ?? stepId,
      type:  (step?.type ?? 'read') as StepType,
      order: step?.order ?? 0,
    };
  };

  const handleResolved = () => qc.invalidateQueries({ queryKey: ['checkout-requests'] });

  const pending  = requests?.filter(r => r.status === 'pending') ?? [];
  const resolved = requests?.filter(r => r.status !== 'pending') ?? [];

  if (isLoading) return (
    <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={16} className="text-rose-500" />
        <h3 className="text-sm font-display font-bold text-foreground">Чек-ауты</h3>
        {pending.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
            {pending.length} ожидает
          </span>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
            Ожидают проверки
          </p>
          {pending.map(req => {
            const meta = getStepMeta(req.course_id, req.step_id);
            return (
              <CheckoutPanel
                key={req.id}
                item={{
                  request: req,
                  studentName: empMap.get(req.employee_id) ?? '—',
                  courseTitle:  courseMap.get(req.course_id)?.title ?? '—',
                  stepTitle:    meta.title,
                  stepType:     meta.type,
                  stepOrder:    meta.order,
                }}
                onResolved={handleResolved}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <ClipboardCheck size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет ожидающих чек-аутов</p>
        </div>
      )}

      {/* History */}
      {resolved.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest">
            История ({resolved.length})
          </p>
          {resolved.slice(0, 20).map(req => {
            const meta = getStepMeta(req.course_id, req.step_id);
            return (
              <CheckoutPanel
                key={req.id}
                item={{
                  request: req,
                  studentName: empMap.get(req.employee_id) ?? '—',
                  courseTitle:  courseMap.get(req.course_id)?.title ?? '—',
                  stepTitle:    meta.title,
                  stepType:     meta.type,
                  stepOrder:    meta.order,
                }}
                onResolved={handleResolved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
