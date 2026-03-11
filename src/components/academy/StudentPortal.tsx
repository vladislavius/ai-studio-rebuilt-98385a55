import { GraduationCap, BookOpen, Play, Award, Clock, ChevronRight, Trophy, Search as SearchIcon, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlossaryManager } from './GlossaryManager';
import { Leaderboard } from './LeaderboardAndBadges';

interface ProgressRow {
  id: string;
  course_id: string;
  progress_percent: number;
  completed_sections: string[] | null;
  completed_at: string | null;
  certified: boolean | null;
  courses: {
    title: string;
    description: string | null;
    sections: any[] | null;
    duration_hours: number | null;
    is_hst_course: boolean | null;
  } | null;
}

interface Props {
  employeeId: string | null;
  employeeName: string | null;
  onStudyCourse: (courseId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNextStep(prog: ProgressRow) {
  const sections = Array.isArray(prog.courses?.sections) ? prog.courses!.sections : [];
  const done = new Set(Array.isArray(prog.completed_sections) ? prog.completed_sections : []);
  return sections.find((s: any) => !done.has(s.id)) as any | undefined;
}

function stepCount(prog: ProgressRow) {
  return Array.isArray(prog.courses?.sections) ? prog.courses!.sections!.length : 0;
}
function doneCount(prog: ProgressRow) {
  return Array.isArray(prog.completed_sections) ? prog.completed_sections.length : 0;
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ prog, onStudy, highlight }: { prog: ProgressRow; onStudy: () => void; highlight?: boolean }) {
  const pct = prog.progress_percent;
  const done = doneCount(prog);
  const total = stepCount(prog);
  const isCompleted = pct >= 100;
  const isNew = pct === 0;

  return (
    <div
      onClick={onStudy}
      className={`group bg-card border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${
        isCompleted ? 'border-emerald-500/25 hover:border-emerald-500/50 hover:shadow-emerald-500/5'
        : highlight ? 'border-primary/30 hover:border-primary/50 hover:shadow-primary/5'
        : 'border-border hover:border-primary/25 hover:shadow-primary/5'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10'
        }`}>
          {isCompleted ? <Award size={18} className="text-emerald-500" /> : <BookOpen size={18} className="text-primary" />}
        </div>
        <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full ${
          isCompleted ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : isNew ? 'bg-muted text-muted-foreground'
          : 'bg-primary/10 text-primary'
        }`}>
          {isCompleted ? '✓ Завершён' : isNew ? 'Не начат' : `${pct}%`}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-display font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
        {prog.courses?.title ?? '—'}
      </h4>
      {prog.courses?.description && (
        <p className="text-[11px] text-muted-foreground font-body mb-3 line-clamp-2">{prog.courses.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-body mb-3">
        {total > 0 && <span>{done}/{total} шагов</span>}
        {prog.courses?.duration_hours && <span>· {prog.courses.duration_hours} ч.</span>}
        {prog.courses?.is_hst_course && <span className="text-primary font-bold">· HST</span>}
      </div>

      {/* Progress bar */}
      {!isNew && (
        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${
              isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary to-primary/70'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* CTA */}
      <div className={`mt-3 flex items-center justify-between text-xs font-display font-bold ${
        isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
      }`}>
        <span>{isCompleted ? 'Просмотр и сертификат' : isNew ? 'Начать обучение' : 'Продолжить'}</span>
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

// ─── Student Portal ───────────────────────────────────────────────────────────
export function StudentPortal({ employeeId, employeeName, onStudyCourse }: Props) {
  const { data: myProgress = [], isLoading } = useQuery({
    queryKey: ['student-portal', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select('*, courses(title, description, sections, duration_hours, is_hst_course)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProgressRow[];
    },
    enabled: !!employeeId,
  });

  const { data: allPublished = [] } = useQuery({
    queryKey: ['catalog-published'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, description, sections, duration_hours, is_hst_course')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const enrolledIds = new Set(myProgress.map(p => p.course_id));
  const catalog = allPublished.filter(c => !enrolledIds.has(c.id));

  const active = myProgress.filter(p => p.progress_percent > 0 && p.progress_percent < 100);
  const completed = myProgress.filter(p => p.progress_percent >= 100);
  const notStarted = myProgress.filter(p => p.progress_percent === 0);
  const heroCourse = active[0] ?? null;

  const firstName = employeeName?.split(' ')[0] ?? null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-learning">
        <TabsList>
          <TabsTrigger value="my-learning" className="flex items-center gap-1.5">
            <GraduationCap size={14} /> Моё обучение
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-1.5">
            <Sparkles size={14} /> Каталог
            {catalog.length > 0 && (
              <span className="ml-1 text-[9px] bg-primary/20 text-primary rounded-full px-1.5 font-bold">{catalog.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="glossary" className="flex items-center gap-1.5">
            <SearchIcon size={14} /> Глоссарий
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1.5">
            <Trophy size={14} /> Рейтинг
          </TabsTrigger>
        </TabsList>

        {/* ──── MY LEARNING ──── */}
        <TabsContent value="my-learning" className="mt-6 space-y-8">

          {/* Welcome hero */}
          <div className="relative bg-gradient-to-br from-primary/12 via-primary/6 to-transparent border border-primary/15 rounded-2xl px-6 py-5 overflow-hidden">
            <div className="absolute right-4 top-2 text-primary/8 pointer-events-none select-none">
              <GraduationCap size={96} />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-0.5">
              {firstName ? `Привет, ${firstName}! 👋` : 'Добро пожаловать!'}
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              {myProgress.length === 0
                ? 'Вам пока не назначены курсы. Загляните в Каталог.'
                : `${active.length > 0 ? `${active.length} курс${active.length > 1 ? 'а' : ''} в процессе · ` : ''}${completed.length} завершено`
              }
            </p>

            {myProgress.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {[
                  { icon: BookOpen,     label: 'Записан',      value: myProgress.length, color: 'text-primary' },
                  { icon: Play,         label: 'В процессе',   value: active.length,     color: 'text-amber-500' },
                  { icon: CheckCircle2, label: 'Завершено',    value: completed.length,  color: 'text-emerald-500' },
                  { icon: Award,        label: 'Сертификатов', value: completed.filter(p => p.certified).length, color: 'text-orange-500' },
                ].map(s => (
                  <div key={s.label} className="bg-background/70 backdrop-blur-sm border border-border/60 rounded-xl px-3 py-2 flex items-center gap-2">
                    <s.icon size={14} className={s.color} />
                    <div>
                      <p className="text-base font-display font-bold text-foreground leading-none">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* "Continue" hero card */}
          {heroCourse && (() => {
            const next = getNextStep(heroCourse);
            const total = stepCount(heroCourse);
            return (
              <div
                onClick={() => onStudyCourse(heroCourse.course_id)}
                className="bg-card border border-primary/20 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Play size={24} className="text-primary ml-0.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display font-bold text-primary uppercase tracking-widest mb-1">Продолжить обучение</p>
                  <h3 className="font-display font-bold text-foreground text-base mb-1.5 truncate">{heroCourse.courses?.title}</h3>
                  {next && (
                    <p className="text-xs text-muted-foreground font-body mb-2.5 truncate">
                      Следующий шаг: <span className="text-foreground font-medium">{next.title || 'Без заголовка'}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                        style={{ width: `${heroCourse.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-display font-bold text-primary shrink-0">{heroCourse.progress_percent}%</span>
                    {total > 0 && <span className="text-[10px] text-muted-foreground font-body shrink-0">{doneCount(heroCourse)}/{total} шагов</span>}
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            );
          })()}

          {/* Other in-progress */}
          {active.length > 1 && (
            <section>
              <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Play size={14} className="text-amber-500" /> В процессе
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.slice(1).map(p => <CourseCard key={p.course_id} prog={p} onStudy={() => onStudyCourse(p.course_id)} highlight />)}
              </div>
            </section>
          )}

          {/* Not started */}
          {notStarted.length > 0 && (
            <section>
              <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-muted-foreground" /> Назначено, не начато
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notStarted.map(p => <CourseCard key={p.course_id} prog={p} onStudy={() => onStudyCourse(p.course_id)} />)}
              </div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Award size={14} className="text-emerald-500" /> Завершённые курсы
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completed.map(p => <CourseCard key={p.course_id} prog={p} onStudy={() => onStudyCourse(p.course_id)} />)}
              </div>
            </section>
          )}

          {/* Empty */}
          {myProgress.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-card/40 border border-dashed border-border/50 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} className="text-muted-foreground/25" />
              </div>
              <p className="text-sm text-muted-foreground font-body mb-1">Курсы ещё не назначены</p>
              <p className="text-xs text-muted-foreground/50 font-body">Перейдите в «Каталог», чтобы начать обучение</p>
            </div>
          )}
        </TabsContent>

        {/* ──── CATALOG ──── */}
        <TabsContent value="catalog" className="mt-6">
          {catalog.length === 0 ? (
            <div className="text-center py-14 text-sm text-muted-foreground font-body">
              Все доступные курсы уже добавлены в ваш план обучения
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map(course => {
                const total = Array.isArray(course.sections) ? course.sections.length : 0;
                return (
                  <div
                    key={course.id}
                    onClick={() => onStudyCourse(course.id)}
                    className="group bg-card/80 border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                      <BookOpen size={18} className="text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                    {course.description && <p className="text-[11px] text-muted-foreground font-body mb-3 line-clamp-2">{course.description}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-body mb-4 flex-wrap">
                      {total > 0 && <span className="flex items-center gap-0.5"><Clock size={10} /> {total} шагов</span>}
                      {course.duration_hours && <span>· {course.duration_hours} ч.</span>}
                      {course.is_hst_course && <span className="text-primary font-bold">· HST</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs font-display font-bold text-primary">
                      <span>Начать обучение</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ──── GLOSSARY ──── */}
        <TabsContent value="glossary" className="mt-6">
          <GlossaryManager />
        </TabsContent>

        {/* ──── LEADERBOARD ──── */}
        <TabsContent value="leaderboard" className="mt-6">
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
