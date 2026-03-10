import { useState } from 'react';
import { ClipboardCheck, Send, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Props {
  courseId: string;
  employeeId: string;
  stepId: string;
  stepTitle: string;
  onRequested: () => void;
}

export function CheckoutRequestPanel({ courseId, employeeId, stepId, stepTitle, onRequested }: Props) {
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const requestMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('checkout_requests').insert([{
        course_id: courseId,
        employee_id: employeeId,
        step_id: stepId,
        status: 'pending',
        supervisor_notes: notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Запрос на чек-аут отправлен');
      qc.invalidateQueries({ queryKey: ['checkout-requests'] });
      onRequested();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={16} className="text-rose-500" />
        <p className="text-sm font-display font-bold text-foreground">Запрос на чек-аут</p>
      </div>
      <p className="text-xs text-muted-foreground font-body">
        Этот шаг требует проверки супервизором. Отправьте запрос, и супервизор проведёт чек-аут.
      </p>
      <p className="text-xs font-display font-semibold text-foreground">Шаг: {stepTitle}</p>
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Комментарий для супервизора (необязательно)..."
        rows={2}
        className="bg-background resize-none text-xs"
      />
      <button
        onClick={() => requestMut.mutate()}
        disabled={requestMut.isPending}
        className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-display font-bold flex items-center gap-1.5 hover:bg-rose-600 transition-colors disabled:opacity-50"
      >
        {requestMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Запросить чек-аут
      </button>
    </div>
  );
}
