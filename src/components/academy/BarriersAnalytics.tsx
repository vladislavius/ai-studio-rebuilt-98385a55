import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, BookOpen, Eye, Clock, MessageSquare, BarChart3 } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { EditableLabel } from '@/components/ui/editable-label';

export function BarriersAnalytics() {
  const { t } = useLabels();

  const { data: wordLogs } = useQuery({
    queryKey: ['word-clearing-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('word_clearing_logs').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: checkouts } = useQuery({
    queryKey: ['checkout-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checkout_requests').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['all-course-progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_progress').select('*');
      if (error) throw error;
      return data;
    },
  });

  const totalWords = wordLogs?.length || 0;
  const clearedWords = wordLogs?.filter(w => w.cleared).length || 0;
  const unclearedWords = totalWords - clearedWords;

  const totalCheckouts = checkouts?.length || 0;
  const approvedCheckouts = checkouts?.filter(c => c.status === 'approved').length || 0;
  const rejectedCheckouts = checkouts?.filter(c => c.status === 'rejected').length || 0;
  const firstPassRate = totalCheckouts > 0 ? Math.round((approvedCheckouts / totalCheckouts) * 100) : 0;

  const stuckStudents = progress?.filter(p => {
    if (!p.started_at) return false;
    const daysAgo = (Date.now() - new Date(p.started_at).getTime()) / (1000 * 60 * 60 * 24);
    return (p.progress_percent || 0) < 50 && daysAgo > 7;
  }).length || 0;

  const wordFreq = new Map<string, number>();
  wordLogs?.forEach(w => {
    wordFreq.set(w.term, (wordFreq.get(w.term) || 0) + 1);
  });
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" /> <EditableLabel labelKey="barriers.title" />
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <BookOpen size={12} className="text-cyan-500" />
            <EditableLabel labelKey="barriers.unclear_words" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{totalWords}</p>
          <p className="text-[10px] text-muted-foreground">{t('barriers.cleared')}: {clearedWords} | {t('barriers.remaining')}: {unclearedWords}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <MessageSquare size={12} className="text-rose-500" />
            <EditableLabel labelKey="barriers.checkouts" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{totalCheckouts}</p>
          <p className="text-[10px] text-muted-foreground">{t('barriers.approved')}: {approvedCheckouts} | {t('barriers.rejected')}: {rejectedCheckouts}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <Eye size={12} className="text-primary" />
            <EditableLabel labelKey="barriers.first_pass" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{firstPassRate}%</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle size={12} className="text-amber-500" />
            <EditableLabel labelKey="barriers.stuck" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase" />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stuckStudents}</p>
          <p className="text-[10px] text-muted-foreground">{t('barriers.stuck_desc')}</p>
        </div>
      </div>

      {topWords.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <EditableLabel labelKey="barriers.top_words" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-3" />
          <div className="space-y-2">
            {topWords.map(([term, count]) => (
              <div key={term} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-display font-semibold text-foreground">{term}</p>
                </div>
                <div className="w-24">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, (count / (topWords[0]?.[1] || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-display font-bold text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <EditableLabel labelKey="barriers.indicators" as="p" className="text-[10px] font-display font-bold text-muted-foreground uppercase" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
            <EditableLabel labelKey="barriers.unclear_words_barrier" as="p" className="text-xs font-display font-bold text-cyan-700 dark:text-cyan-400 mb-1" />
            <p className="text-[10px] text-muted-foreground font-body">
              {unclearedWords > 5 ? `⚠️ ${unclearedWords} ${t('barriers.unclear_words_warn')}` : t('barriers.unclear_words_ok')}
            </p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
            <EditableLabel labelKey="barriers.no_mass" as="p" className="text-xs font-display font-bold text-emerald-700 dark:text-emerald-400 mb-1" />
            <p className="text-[10px] text-muted-foreground font-body">
              {rejectedCheckouts > 3 ? `⚠️ ${t('barriers.no_mass_warn')}` : t('barriers.no_mass_ok')}
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <EditableLabel labelKey="barriers.steep_gradient" as="p" className="text-xs font-display font-bold text-amber-700 dark:text-amber-400 mb-1" />
            <p className="text-[10px] text-muted-foreground font-body">
              {stuckStudents > 2 ? `⚠️ ${stuckStudents} ${t('barriers.steep_gradient_warn')}` : t('barriers.steep_gradient_ok')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
