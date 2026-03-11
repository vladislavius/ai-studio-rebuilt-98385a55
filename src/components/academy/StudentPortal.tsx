import {
  GraduationCap, BookOpen, Play, Award, Clock, ChevronRight,
  Trophy, Search as SearchIcon, CheckCircle2, Sparkles, ArrowRight,
  BookMarked, Flame, Target, TrendingUp, Star, Brain, Layers,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

type Tab = 'learning' | 'catalog' | 'glossary' | 'leaderboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNextStep(prog: ProgressRow) {
  const sections = Array.isArray(prog.courses?.sections) ? prog.courses!.sections : [];
  const done = new Set(Array.isArray(prog.completed_sections) ? prog.completed_sections : []);
  return sections.find((s: any) => !done.has(s.id)) as any | undefined;
}
function totalSteps(prog: ProgressRow) {
  return Array.isArray(prog.courses?.sections) ? prog.courses!.sections!.length : 0;
}
function doneSteps(prog: ProgressRow) {
  return Array.isArray(prog.completed_sections) ? prog.completed_sections.length : 0;
}

// ─── Circular progress ────────────────────────────────────────────────────────
function CircularProgress({ pct, size = 40, strokeW = 3, color = '#6366f1' }: {
  pct: number; size?: number; strokeW?: number; color?: string;
}) {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeW} className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────
const STUDENT_PALETTE = [
  { bg: 'from-violet-500/15 to-violet-500/5', icon: 'bg-violet-500/10 text-violet-500', ring: '#8b5cf6', bar: 'from-violet-500 to-purple-500' },
  { bg: 'from-blue-500/15 to-blue-500/5',     icon: 'bg-blue-500/10 text-blue-500',     ring: '#3b82f6', bar: 'from-blue-500 to-cyan-500' },
  { bg: 'from-emerald-500/15 to-emerald-500/5', icon: 'bg-emerald-500/10 text-emerald-500', ring: '#10b981', bar: 'from-emerald-500 to-teal-500' },
  { bg: 'from-orange-500/15 to-orange-500/5', icon: 'bg-orange-500/10 text-orange-500', ring: '#f97316', bar: 'from-orange-500 to-amber-500' },
  { bg: 'from-rose-500/15 to-rose-500/5',     icon: 'bg-rose-500/10 text-rose-500',     ring: '#f43f5e', bar: 'from-rose-500 to-pink-500' },
  { bg: 'from-cyan-500/15 to-cyan-500/5',     icon: 'bg-cyan-500/10 text-cyan-500',     ring: '#06b6d4', bar: 'from-cyan-500 to-sky-500' },
];

function CourseCard({
  prog, index, onStudy, variant = 'default',
}: {
  prog: ProgressRow;
  index: number;
  onStudy: () => void;
  variant?: 'default' | 'compact' | 'hero';
}) {
  const pal = STUDENT_PALETTE[index % STUDENT_PALETTE.length];
  const pct = prog.progress_percent;
  const done = doneSteps(prog);
  const total = totalSteps(prog);
  const isCompleted = pct >= 100;
  const isNew = pct === 0;

  if (variant === 'hero') {
    const next = getNextStep(prog);
    return (
      <div
        onClick={onStudy}
        className="group relative bg-card border border-primary/20 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${pal.bg} opacity-60`} />
        <div className="relative p-6 flex items-center gap-5">
          <div className="relative shrink-0">
            <CircularProgress pct={pct} size={64} strokeW={4} color={pal.ring} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={18} className="text-primary ml-0.5" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display font-bold text-primary uppercase tracking-widest mb-1">
              Продолжить обучение
            </p>
            <h3 className="font-display font-bold text-foreground text-base mb-1 truncate group-hover:text-primary transition-colors">
              {prog.courses?.title}
            </h3>
            {next && (
              <p className="text-xs text-muted-foreground font-body mb-2.5 truncate">
                Следующий шаг: <span className="text-foreground font-medium">{next.title || 'Без заголовка'}</span>
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${pal.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-display font-bold text-primary shrink-0">{pct}%</span>
              {total > 0 && <span className="text-[10px] text-muted-foreground font-body shrink-0">{done}/{total} шагов</span>}
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onStudy}
      className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
    >
      <div className={`h-1 bg-gradient-to-r ${pal.bar} opacity-60`} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : pal.icon} flex items-center justify-center shrink-0`}>
            {isCompleted ? <Award size={18} /> : <Brain size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {prog.courses?.title ?? '—'}
            </h4>
          </div>
          <div className="shrink-0">
            {!isNew && (
              <div className="relative">
                <CircularProgress pct={pct} size={32} strokeW={2.5} color={isCompleted ? '#10b981' : pal.ring} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-foreground">{pct}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {prog.courses?.description && (
          <p className="text-[11px] text-muted-foreground font-body mb-3 line-clamp-2 leading-relaxed">
            {prog.courses.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-body pt-3 border-t border-border/50">
          {total > 0 && <span className="flex items-center gap-1"><Target size={10} />{done}/{total} шагов</span>}
          {prog.courses?.duration_hours && <span className="flex items-center gap-1"><Clock size={10} />{prog.courses.duration_hours} ч.</span>}
          {prog.courses?.is_hst_course && <span className="flex items-center gap-1 text-primary font-bold"><Star size={10} />HST</span>}
          <span className={`ml-auto font-display font-semibold ${
            isCompleted ? 'text-emerald-500' : isNew ? 'text-muted-foreground' : 'text-primary'
          }`}>
            {isCompleted ? '✓ Завершён' : isNew ? 'Начать →' : 'Продолжить →'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog card ─────────────────────────────────────────────────────────────
function CatalogCard({ course, index, onStudy }: { course: any; index: number; onStudy: () => void }) {
  const pal = STUDENT_PALETTE[index % STUDENT_PALETTE.length];
  const stepCount = Array.isArray(course.sections) ? course.sections.length : 0;
  return (
    <div
      onClick={onStudy}
      className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
    >
      <div className={`h-1 bg-gradient-to-r ${pal.bar} opacity-60`} />
      <div className="p-5">
        <div className={`w-10 h-10 rounded-xl ${pal.icon} flex items-center justify-center mb-3`}>
          <BookOpen size={18} />
        </div>
        <h3 className="font-display font-semibold text-sm text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-[11px] text-muted-foreground font-body mb-3 line-clamp-2">{course.description}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-body pt-3 border-t border-border/50">
          {stepCount > 0 && <span className="flex items-center gap-1"><Layers size={10} />{stepCount} шагов</span>}
          {course.duration_hours && <span className="flex items-center gap-1"><Clock size={10} />{course.duration_hours} ч.</span>}
          {course.is_hst_course && <span className="flex items-center gap-1 text-primary font-bold"><Star size={10} />HST</span>}
          <span className="ml-auto font-display font-bold text-primary flex items-center gap-0.5">
            Начать <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
const NAV_TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: 'learning',    icon: GraduationCap, label: 'Моё обучение' },
  { id: 'catalog',     icon: Sparkles,      label: 'Каталог' },
  { id: 'glossary',    icon: BookMarked,    label: 'Глоссарий' },
  { id: 'leaderboard', icon: Trophy,        label: 'Рейтинг' },
];

// ─── Student Portal ───────────────────────────────────────────────────────────
export function StudentPortal({ employeeId, employeeName, onStudyCourse }: Props) {
  const [tab, setTab] = useState<Tab>('learning');

  const { data: myProgress = [], isLoading } = useQuery({
    queryKey: ['student-portal', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select('*, courses(title, description, sections, duration_hours, is_hst_course)')
        .eq('employee_id', employeeId)
        .order('started_at', { ascending: false });
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
  const firstName = employeeName?.split(' ').find(Boolean) ?? null;

  return (
    <div className="flex -mt-6 -mx-6 min-h-[calc(100vh-64px)]">

      {/* Sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 bg-card/80 backdrop-blur-sm border-r border-border/60 flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
              <GraduationCap size={16} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-foreground leading-none">Академия</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {firstName ? `Студент: ${firstName}` : 'Студент'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3">
          <p className="px-3 mb-1 text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest">
            Навигация
          </p>
          {NAV_TABS.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-display font-medium transition-all mb-0.5 ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                <item.icon size={14} className={active ? 'text-primary' : ''} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'catalog' && catalog.length > 0 && (
                  <span className="text-[9px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-bold">
                    {catalog.length}
                  </span>
                )}
                {active && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Progress summary */}
        {myProgress.length > 0 && (
          <div className="px-4 py-3 border-t border-border/60 space-y-1.5">
            <p className="text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">Мой прогресс</p>
            {[
              { label: 'В процессе', value: myProgress.filter(p => p.progress_percent > 0 && p.progress_percent < 100).length, color: 'text-amber-500' },
              { label: 'Завершено', value: myProgress.filter(p => p.progress_percent >= 100).length, color: 'text-emerald-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-body">{s.label}</span>
                <span className={`font-display font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Mobile tab bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex md:hidden z-30">
        {NAV_TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-display font-semibold transition-colors ${
              tab === item.id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon size={18} />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-background pb-16 md:pb-0">

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60 px-6 py-3">
          <h1 className="text-lg font-display font-bold text-foreground">
            {NAV_TABS.find(t => t.id === tab)?.label}
          </h1>
        </div>

        <div className="p-6">

          {/* ── MY LEARNING ── */}
          {tab === 'learning' && (
            <div className="space-y-8">

              {/* Welcome hero */}
              <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-2xl px-6 py-5 overflow-hidden">
                <div className="absolute -right-4 -top-4 text-primary/5 pointer-events-none">
                  <GraduationCap size={120} />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  {firstName ? `Привет, ${firstName}! 👋` : 'Добро пожаловать!'}
                </h2>
                <p className="text-sm text-muted-foreground font-body mb-4">
                  {myProgress.length === 0
                    ? 'Вам пока не назначены курсы. Загляните в Каталог.'
                    : `${active.length > 0 ? `${active.length} курс${active.length > 1 ? 'а' : ''} в процессе · ` : ''}${completed.length} завершено`
                  }
                </p>

                {myProgress.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { icon: BookOpen,     label: 'Записан',      value: myProgress.length,                                 color: 'text-primary' },
                      { icon: Flame,        label: 'В процессе',   value: active.length,                                     color: 'text-amber-500' },
                      { icon: CheckCircle2, label: 'Завершено',    value: completed.length,                                  color: 'text-emerald-500' },
                      { icon: Award,        label: 'Сертификатов', value: completed.filter(p => p.certified).length,         color: 'text-orange-500' },
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

              {/* Continue learning hero */}
              {heroCourse && (
                <CourseCard
                  prog={heroCourse}
                  index={0}
                  onStudy={() => onStudyCourse(heroCourse.course_id)}
                  variant="hero"
                />
              )}

              {/* Other in-progress */}
              {active.length > 1 && (
                <section>
                  <h3 className="text-sm font-display font-bold text-foreground mb-3 flex items-center gap-2">
                    <Flame size={14} className="text-amber-500" /> В процессе
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {active.slice(1).map((p, i) => (
                      <CourseCard key={p.course_id} prog={p} index={i + 1} onStudy={() => onStudyCourse(p.course_id)} />
                    ))}
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
                    {notStarted.map((p, i) => (
                      <CourseCard key={p.course_id} prog={p} index={i + 2} onStudy={() => onStudyCourse(p.course_id)} />
                    ))}
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
                    {completed.map((p, i) => (
                      <CourseCard key={p.course_id} prog={p} index={i + 4} onStudy={() => onStudyCourse(p.course_id)} />
                    ))}
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
                  <button
                    onClick={() => setTab('catalog')}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-colors"
                  >
                    Открыть каталог
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CATALOG ── */}
          {tab === 'catalog' && (
            catalog.length === 0 ? (
              <div className="text-center py-20 bg-card/40 border border-dashed border-border/50 rounded-2xl">
                <Sparkles size={28} className="text-muted-foreground/25 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-body">
                  Все доступные курсы уже добавлены в ваш план обучения
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-body">{catalog.length} доступных курсов</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {catalog.map((course, i) => (
                    <CatalogCard key={course.id} course={course} index={i} onStudy={() => onStudyCourse(course.id)} />
                  ))}
                </div>
              </div>
            )
          )}

          {/* ── GLOSSARY ── */}
          {tab === 'glossary' && <GlossaryManager />}

          {/* ── LEADERBOARD ── */}
          {tab === 'leaderboard' && <Leaderboard />}
        </div>
      </main>
    </div>
  );
}
