import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, PenLine, Eye, Dumbbell, Star, Check, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ChecksheetItem {
  id: string;
  order: number;
  type: 'read' | 'write' | 'demo' | 'drill' | 'starrate';
  title: string;
  content: string;
}

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  read: { label: 'Прочитать', icon: BookOpen, color: 'text-blue-500' },
  write: { label: 'Написать', icon: PenLine, color: 'text-amber-500' },
  demo: { label: 'Демо', icon: Eye, color: 'text-emerald-500' },
  drill: { label: 'Упражнение', icon: Dumbbell, color: 'text-purple-500' },
  starrate: { label: 'Звёздная оценка', icon: Star, color: 'text-orange-500' },
};

interface Props {
  courseId: string;
  onBack: () => void;
  employeeId?: string; // if viewing as specific employee
}

export function CourseStudyView({ courseId, onBack, employeeId }: Props) {
  const qc = useQueryClient();
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (error) throw error;
      return data;
    },
  });

  // Try to find progress record for this employee
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

  const items: ChecksheetItem[] = course && Array.isArray(course.sections)
    ? (course.sections as unknown as ChecksheetItem[]).sort((a, b) => a.order - b.order)
    : [];

  useEffect(() => {
    if (progressRecord?.completed_sections && Array.isArray(progressRecord.completed_sections)) {
      setCompletedIds(progressRecord.completed_sections as string[]);
      // Set active to first incomplete
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
        // Move to next item
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

      {/* Progress bar */}
      <Progress value={progressPercent} className="h-2" />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Sidebar - item list */}
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
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left p-3 flex items-start gap-2.5 border-b border-border/50 transition-colors ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/50'}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>
                    {done ? <Check size={12} /> : <span className="text-[10px] text-muted-foreground">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-body leading-tight ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.title || 'Без заголовка'}</p>
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
              </div>

              <h2 className="text-lg font-display font-bold text-foreground">{activeItem.title || 'Без заголовка'}</h2>

              {activeItem.content && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm font-body text-foreground leading-relaxed whitespace-pre-wrap">
                  {activeItem.content}
                </div>
              )}

              {employeeId && !isItemCompleted(activeItem.id) && (
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
