import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect } from 'react';
import { toast } from 'sonner';

// ─── Auto-award badges on mount ──────────────────────────────────────────────
export function useBadgeAutoAward(employeeId: string | undefined) {
  const qc = useQueryClient();

  const { data: progress } = useQuery({
    queryKey: ['badge-check-progress', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await supabase.from('course_progress').select('course_id, completed_at, certified').eq('employee_id', employeeId);
      return data ?? [];
    },
    enabled: !!employeeId,
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('badges').select('*');
      return data ?? [];
    },
  });

  const { data: earned } = useQuery({
    queryKey: ['student-badges', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await (supabase as any).from('student_badges').select('badge_id, course_id').eq('employee_id', employeeId);
      return (data ?? []) as { badge_id: string; course_id: string | null }[];
    },
    enabled: !!employeeId,
  });

  const awardMut = useMutation({
    mutationFn: async ({ badgeId, courseId }: { badgeId: string; courseId: string | null }) => {
      const { error } = await (supabase as any).from('student_badges').insert({ employee_id: employeeId, badge_id: badgeId, course_id: courseId });
      if (error && !error.message?.includes('duplicate')) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-badges', employeeId] }),
  });

  useEffect(() => {
    if (!progress || !badges || !earned || !employeeId) return;

    const earnedSet = new Set((earned as any[]).map((e: any) => `${e.badge_id}:${e.course_id}`));
    const completedCourses = progress.filter(p => p.completed_at);
    const certifiedCourses = progress.filter(p => p.certified);

    for (const badge of (badges as any[])) {
      if (badge.condition_type === 'first_course' && completedCourses.length >= 1) {
        const key = `${badge.id}:null`;
        if (!earnedSet.has(key)) {
          awardMut.mutate({ badgeId: badge.id, courseId: null });
          toast.success(`🏆 Новый бейдж: «${badge.title}»!`);
        }
      }
      if (badge.condition_type === 'course_complete') {
        for (const p of completedCourses) {
          const key = `${badge.id}:${p.course_id}`;
          if (!earnedSet.has(key)) {
            awardMut.mutate({ badgeId: badge.id, courseId: p.course_id });
          }
        }
      }
      if (badge.condition_type === 'certified') {
        for (const p of certifiedCourses) {
          const key = `${badge.id}:${p.course_id}`;
          if (!earnedSet.has(key)) {
            awardMut.mutate({ badgeId: badge.id, courseId: p.course_id });
            toast.success(`🎓 Новый бейдж: «${badge.title}»!`);
          }
        }
      }
    }
  }, [progress?.length, badges?.length, earned?.length]);
}

// ─── Student Badges Display ───────────────────────────────────────────────────
export function StudentBadges({ employeeId }: { employeeId: string }) {
  const { data: earned = [] } = useQuery({
    queryKey: ['student-badges', employeeId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('student_badges').select('badge_id, course_id, earned_at, badges(title, icon, description)').eq('employee_id', employeeId);
      return (data ?? []) as { badge_id: string; course_id: string | null; earned_at: string; badges: { title: string; icon: string; description: string } }[];
    },
  });

  if (earned.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-display font-bold text-muted-foreground uppercase flex items-center gap-1">
        <Award size={10} /> Мои достижения
      </p>
      <div className="flex flex-wrap gap-2">
        {earned.map((e, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/20 rounded-lg" title={e.badges?.description}>
            <span>{e.badges?.icon || '🏆'}</span>
            <span className="text-[10px] font-display font-bold text-foreground">{e.badges?.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export function Leaderboard() {
  const { isAdmin, isSupervisor } = useAuth();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['all-course-progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_progress').select('employee_id, progress_percent, certified, completed_at');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('id, full_name, position');
      if (error) throw error;
      return data;
    },
  });

  const { data: studentBadges } = useQuery({
    queryKey: ['all-student-badges'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('student_badges').select('employee_id');
      return (data ?? []) as { employee_id: string }[];
    },
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Загрузка...</div>;

  // Aggregate per student
  const stats = new Map<string, { totalProgress: number; courses: number; certified: number; completed: number; badges: number }>();
  (progress ?? []).forEach(p => {
    const cur = stats.get(p.employee_id) ?? { totalProgress: 0, courses: 0, certified: 0, completed: 0, badges: 0 };
    cur.courses++;
    cur.totalProgress += p.progress_percent || 0;
    if (p.certified) cur.certified++;
    if (p.completed_at) cur.completed++;
    stats.set(p.employee_id, cur);
  });
  (studentBadges ?? []).forEach(b => {
    const cur = stats.get(b.employee_id);
    if (cur) cur.badges++;
  });

  const empMap = new Map(employees?.map(e => [e.id, e]) || []);

  // Sort: certified desc, then completed desc, then avg progress desc
  const ranked = [...stats.entries()]
    .map(([empId, s]) => ({ empId, ...s, avgProgress: s.courses > 0 ? Math.round(s.totalProgress / s.courses) : 0 }))
    .sort((a, b) => b.certified - a.certified || b.completed - a.completed || b.avgProgress - a.avgProgress);

  const medalIcon = (idx: number) => {
    if (idx === 0) return <Trophy size={16} className="text-amber-500" />;
    if (idx === 1) return <Medal size={16} className="text-slate-400" />;
    if (idx === 2) return <Medal size={16} className="text-amber-700" />;
    return <span className="text-xs font-display font-bold text-muted-foreground w-4 text-center">{idx + 1}</span>;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
        <Trophy size={16} className="text-amber-500" /> Рейтинг студентов
      </h3>

      {ranked.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Trophy size={32} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-body">Нет данных для отображения</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((r, idx) => {
            const emp = empMap.get(r.empId);
            return (
              <div key={r.empId} className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${idx === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'}`}>
                <div className="w-8 flex items-center justify-center shrink-0">
                  {medalIcon(idx)}
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-bold text-primary">
                    {(emp?.full_name ?? '?').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground truncate">{emp?.full_name || '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress value={r.avgProgress} className="h-1 flex-1 max-w-24" />
                    <span className="text-[10px] text-muted-foreground">{r.avgProgress}% ср.</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  {r.certified > 0 && (
                    <div className="text-center">
                      <p className="text-sm font-display font-bold text-primary">{r.certified}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Серт.</p>
                    </div>
                  )}
                  {r.badges > 0 && (
                    <div className="text-center">
                      <p className="text-sm font-display font-bold text-amber-500">{r.badges}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Бейдж.</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-display font-bold text-foreground">{r.courses}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Курсов</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
