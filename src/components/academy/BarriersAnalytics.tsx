import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, BookOpen, Eye, Clock, MessageSquare, BarChart3 } from 'lucide-react';

export function BarriersAnalytics() {
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

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title, sections');
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

  // Find stuck students (progress < 50% and started > 7 days ago)
  const stuckStudents = progress?.filter(p => {
    if (!p.started_at) return false;
    const daysAgo = (Date.now() - new Date(p.started_at).getTime()) / (1000 * 60 * 60 * 24);
    return (p.progress_percent || 0) < 50 && daysAgo > 7;
  }).length || 0;

  // Top unclear words
  const wordFreq = new Map<string, number>();
  wordLogs?.forEach(w => {
    wordFreq.set(w.term, (wordFreq.get(w.term) || 0) + 1);
  });
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Step bottlenecks: find steps where students get stuck
  const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" /> Аналитика по барьерам к обучению
      </h3>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <BookOpen size={12} className="text-cyan-500" />
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Неясные слова</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{totalWords}</p>
          <p className="text-[10px] text-muted-foreground">Прояснено: {clearedWords} | Осталось: {unclearedWords}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <MessageSquare size={12} className="text-rose-500" />
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Чек-ауты</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{totalCheckouts}</p>
          <p className="text-[10px] text-muted-foreground">Зачёт: {approvedCheckouts} | Пересдача: {rejectedCheckouts}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <Eye size={12} className="text-primary" />
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">% зачёта с 1 раза</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{firstPassRate}%</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle size={12} className="text-amber-500" />
            <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Застряли</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stuckStudents}</p>
          <p className="text-[10px] text-muted-foreground">{'<'}50% за 7+ дней</p>
        </div>
      </div>

      {/* Top unclear words */}
      {topWords.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-display font-bold text-muted-foreground uppercase mb-3">
            Самые частые неясные слова
          </p>
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

      {/* Barriers detection hints */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-display font-bold text-muted-foreground uppercase">Индикаторы барьеров</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
            <p className="text-xs font-display font-bold text-cyan-700 dark:text-cyan-400 mb-1">🔤 Неясные слова</p>
            <p className="text-[10px] text-muted-foreground font-body">
              {unclearedWords > 5 ? `⚠️ ${unclearedWords} непрояснённых слов — рекомендуется word clearing` : '✅ Ситуация под контролем'}
            </p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-xs font-display font-bold text-emerald-700 dark:text-emerald-400 mb-1">📦 Отсутствие массы</p>
            <p className="text-[10px] text-muted-foreground font-body">
              {rejectedCheckouts > 3 ? '⚠️ Много пересдач — возможно, не хватает демонстраций' : '✅ Демо и практика работают'}
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs font-display font-bold text-amber-700 dark:text-amber-400 mb-1">📈 Крутой градиент</p>
            <p className="text-[10px] text-muted-foreground font-body">
              {stuckStudents > 2 ? `⚠️ ${stuckStudents} студентов застряли — проверьте градиент сложности` : '✅ Темп обучения нормальный'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
