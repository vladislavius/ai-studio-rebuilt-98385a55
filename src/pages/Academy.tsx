import { useState, useMemo } from 'react';
import {
  GraduationCap, BookOpen, Plus, Trash2, Eye, EyeOff, ArrowLeft,
  ClipboardList, BarChart3, FileText, Search, ClipboardCheck,
  AlertTriangle, Layers, Users, RefreshCw, Trophy, Clock, Star,
  BookMarked, UserCheck, Brain, ChevronRight, Sparkles, Target,
  TrendingUp, CheckCircle2, Lock, X, Menu,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLabels } from '@/hooks/useLabels';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CourseChecksheet } from '@/components/academy/CourseChecksheet';
import { CourseStudyView } from '@/components/academy/CourseStudyView';
import { CourseRoom } from '@/components/academy/CourseRoom';
import { CourseBuilder } from '@/components/academy/CourseBuilder';
import { ProgressDashboard } from '@/components/academy/ProgressDashboard';
import { AcademyDocsPage } from '@/components/academy/AcademyDocsPage';
import { GlossaryManager } from '@/components/academy/GlossaryManager';
import { CheckoutReviewPanel } from '@/components/academy/CheckoutReviewPanel';
import { BarriersAnalytics } from '@/components/academy/BarriersAnalytics';
import { ProgramsManager } from '@/components/academy/ProgramsManager';
import { SupervisorAssignment } from '@/components/academy/SupervisorAssignment';
import { SupervisorDashboard } from '@/components/academy/SupervisorDashboard';
import { TwinningManager } from '@/components/academy/TwinningManager';
import { Leaderboard } from '@/components/academy/LeaderboardAndBadges';
import { ExtraAssignmentsManager } from '@/components/academy/SupervisorTools';
import { StudentPortal } from '@/components/academy/StudentPortal';

// ─── Types ────────────────────────────────────────────────────────────────────
type Section =
  | 'courses' | 'programs' | 'glossary' | 'progress'
  | 'checkouts' | 'barriers' | 'twinning' | 'supervisors'
  | 'students' | 'assignments' | 'leaderboard' | 'docs';

type View = 'main' | 'course-editor' | 'course-study' | 'course-room' | 'course-builder';
type StatusFilter = 'all' | 'published' | 'draft' | 'hst';

interface NavItem {
  id: Section;
  icon: React.ElementType;
  label: string;
  group: string;
  forAdmin?: boolean;
  forAuthor?: boolean;
  forSupervisor?: boolean;
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV: NavItem[] = [
  // Content
  { id: 'courses',     icon: ClipboardList,   label: 'Курсы',        group: 'Контент',    forAdmin: true, forAuthor: true, forSupervisor: true },
  { id: 'programs',    icon: Layers,          label: 'Программы',    group: 'Контент',    forAdmin: true, forAuthor: true },
  { id: 'glossary',    icon: BookMarked,      label: 'Глоссарий',    group: 'Контент',    forAdmin: true, forAuthor: true, forSupervisor: true },
  // Analytics
  { id: 'progress',    icon: BarChart3,       label: 'Прогресс',     group: 'Аналитика',  forAdmin: true, forAuthor: true, forSupervisor: true },
  { id: 'barriers',   icon: AlertTriangle,   label: 'Барьеры',      group: 'Аналитика',  forAdmin: true, forSupervisor: true },
  // Management
  { id: 'checkouts',   icon: ClipboardCheck,  label: 'Чек-ауты',     group: 'Управление', forAdmin: true, forSupervisor: true },
  { id: 'students',    icon: Users,           label: 'Мои студенты', group: 'Управление', forSupervisor: true },
  { id: 'twinning',   icon: RefreshCw,       label: 'Твиннинг',     group: 'Управление', forAdmin: true, forSupervisor: true },
  { id: 'assignments', icon: Target,          label: 'Задания',      group: 'Управление', forAdmin: true, forSupervisor: true },
  { id: 'supervisors', icon: UserCheck,       label: 'Супервизоры',  group: 'Управление', forAdmin: true },
  // Other
  { id: 'leaderboard', icon: Trophy,          label: 'Рейтинг',      group: 'Другое',     forAdmin: true, forAuthor: true, forSupervisor: true },
  { id: 'docs',        icon: FileText,        label: 'Документация', group: 'Другое',     forAdmin: true, forAuthor: true },
];

// ─── Course card colors ────────────────────────────────────────────────────────
const CARD_PALETTE = [
  { gradient: 'from-violet-500/15 to-violet-600/5', border: 'group-hover:border-violet-500/30', icon: 'bg-violet-500/10 text-violet-500', bar: 'from-violet-500 to-purple-500' },
  { gradient: 'from-blue-500/15 to-blue-600/5',     border: 'group-hover:border-blue-500/30',   icon: 'bg-blue-500/10 text-blue-500',    bar: 'from-blue-500 to-cyan-500' },
  { gradient: 'from-emerald-500/15 to-emerald-600/5', border: 'group-hover:border-emerald-500/30', icon: 'bg-emerald-500/10 text-emerald-500', bar: 'from-emerald-500 to-teal-500' },
  { gradient: 'from-orange-500/15 to-orange-600/5', border: 'group-hover:border-orange-500/30', icon: 'bg-orange-500/10 text-orange-500', bar: 'from-orange-500 to-amber-500' },
  { gradient: 'from-rose-500/15 to-rose-600/5',     border: 'group-hover:border-rose-500/30',   icon: 'bg-rose-500/10 text-rose-500',    bar: 'from-rose-500 to-pink-500' },
  { gradient: 'from-cyan-500/15 to-cyan-600/5',     border: 'group-hover:border-cyan-500/30',   icon: 'bg-cyan-500/10 text-cyan-500',    bar: 'from-cyan-500 to-sky-500' },
  { gradient: 'from-amber-500/15 to-amber-600/5',   border: 'group-hover:border-amber-500/30',  icon: 'bg-amber-500/10 text-amber-500',  bar: 'from-amber-500 to-yellow-500' },
  { gradient: 'from-indigo-500/15 to-indigo-600/5', border: 'group-hover:border-indigo-500/30', icon: 'bg-indigo-500/10 text-indigo-500', bar: 'from-indigo-500 to-blue-500' },
];

// ─── Main component ────────────────────────────────────────────────────────────
export function AcademyPage() {
  const { isAdmin, isSupervisor, isAuthor, user, roles } = useAuth();
  const { t } = useLabels();
  const qc = useQueryClient();
  const isManager = isAdmin || isAuthor;

  const [view, setView] = useState<View>('main');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>(
    isManager ? 'courses' : isSupervisor ? 'students' : 'courses'
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_hours: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase.from('employees').select('id, full_name').eq('email', user.email).maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: async (c: typeof form) => {
      const { error } = await supabase.from('courses').insert([{
        title: c.title,
        description: c.description || null,
        duration_hours: c.duration_hours ? parseFloat(c.duration_hours) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Курс создан');
      setShowCreateForm(false);
      setForm({ title: '', description: '', duration_hours: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('courses').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Курс удалён'); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  const openCourseEditor  = (id: string) => { setSelectedCourseId(id); setView('course-editor'); };
  const openCourseStudy   = (id: string) => { setSelectedCourseId(id); setView('course-study'); };
  // New: strict ТО ЛРХ sequential study mode
  const openCourseRoom    = (id: string) => { setSelectedCourseId(id); setView('course-room'); };
  // New: block-based course builder
  const openCourseBuilder = (id: string) => { setSelectedCourseId(id); setView('course-builder'); };
  const backToMain        = () => { setView('main'); setSelectedCourseId(null); };

  // ── Sidebar nav items filtered by role (must be before early returns) ────
  const navItems = NAV.filter(item =>
    (isAdmin && item.forAdmin) ||
    (isAuthor && item.forAuthor) ||
    (isSupervisor && item.forSupervisor)
  );
  const navGroups = [...new Set(navItems.map(i => i.group))];

  // ── Filtered courses (useMemo must be before early returns) ──────────────
  const filteredCourses = useMemo(() => {
    return (courses ?? []).filter(c => {
      const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && c.is_published) ||
        (statusFilter === 'draft' && !c.is_published) ||
        (statusFilter === 'hst' && c.is_hst_course);
      return matchSearch && matchStatus;
    });
  }, [courses, search, statusFilter]);

  // ── Full-page views (after all hooks) ────────────────────────────────────
  if (view === 'course-editor' && selectedCourseId) {
    return <CourseChecksheet courseId={selectedCourseId} onBack={backToMain} />;
  }
  if (view === 'course-builder' && selectedCourseId) {
    return <CourseBuilder courseId={selectedCourseId} onBack={backToMain} />;
  }
  if (view === 'course-study' && selectedCourseId) {
    return <CourseStudyView courseId={selectedCourseId} onBack={backToMain} employeeId={myEmployee?.id} />;
  }
  if (view === 'course-room' && selectedCourseId && myEmployee?.id) {
    return (
      <CourseRoom
        courseId={selectedCourseId}
        employeeId={myEmployee.id}
        userRoles={roles}
        onBack={backToMain}
      />
    );
  }

  // ── Student portal ────────────────────────────────────────────────────────
  if (!isManager && !isSupervisor) {
    return (
      <StudentPortal
        employeeId={myEmployee?.id ?? null}
        employeeName={(myEmployee as any)?.full_name ?? null}
        onStudyCourse={myEmployee?.id ? openCourseRoom : openCourseStudy}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
            <GraduationCap size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-foreground leading-none">Академия</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Study Technology</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map(group => (
          <div key={group} className="mb-4">
            <p className="px-3 mb-1 text-[9px] font-display font-bold text-muted-foreground uppercase tracking-widest">
              {group}
            </p>
            {navItems.filter(i => i.group === group).map(item => {
              const Icon = item.icon;
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentSection(item.id); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-display font-medium transition-all mb-0.5 ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-primary' : ''} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-body">{courses?.length ?? 0} курсов</span>
          <span className="font-body">{courses?.filter(c => c.is_published).length ?? 0} активных</span>
        </div>
      </div>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex -mt-6 -mx-6 min-h-[calc(100vh-64px)]">

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-52 shrink-0 bg-card/80 backdrop-blur-sm border-r border-border/60 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300 md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-display font-bold text-sm">Академия</span>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-1 rounded hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto"><SidebarContent /></div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-background">

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/60 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Menu size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground leading-none">
              {navItems.find(i => i.id === currentSection)?.label ?? 'Академия'}
            </h1>
          </div>
          {isManager && currentSection === 'courses' && (
            <button
              onClick={() => setShowCreateForm(v => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 shrink-0"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Создать курс</span>
              <span className="sm:hidden">Создать</span>
            </button>
          )}
        </div>

        {/* Section content */}
        <div className="p-6">
          {currentSection === 'courses' && (
            <CoursesSection
              courses={filteredCourses}
              allCoursesCount={courses?.length ?? 0}
              isManager={isManager}
              isAdmin={isAdmin ?? false}
              showCreateForm={showCreateForm}
              setShowCreateForm={setShowCreateForm}
              form={form}
              setForm={setForm}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              isLoading={isLoading}
              onCreateCourse={() => createMut.mutate(form)}
              onDeleteCourse={(id) => deleteMut.mutate(id)}
              onTogglePublish={(id, published) => togglePublish.mutate({ id, published })}
              onEditCourse={openCourseEditor}
              onStudyCourse={openCourseStudy}
              onStudyHST={openCourseRoom}
              onEditBuilder={openCourseBuilder}
            />
          )}
          {currentSection === 'progress'    && <ProgressDashboard />}
          {currentSection === 'checkouts'   && <CheckoutReviewPanel />}
          {currentSection === 'glossary'    && <GlossaryManager />}
          {currentSection === 'barriers'    && <BarriersAnalytics />}
          {currentSection === 'programs'    && <ProgramsManager />}
          {currentSection === 'supervisors' && <SupervisorAssignment />}
          {currentSection === 'students'    && <SupervisorDashboard />}
          {currentSection === 'twinning'    && <TwinningManager />}
          {currentSection === 'assignments' && <ExtraAssignmentsManager />}
          {currentSection === 'leaderboard' && <Leaderboard />}
          {currentSection === 'docs'        && <AcademyDocsPage />}
        </div>
      </main>
    </div>
  );
}

// ─── Courses section ──────────────────────────────────────────────────────────
interface CoursesSectionProps {
  courses: any[];
  allCoursesCount: number;
  isManager: boolean;
  isAdmin: boolean;
  showCreateForm: boolean;
  setShowCreateForm: (v: boolean) => void;
  form: { title: string; description: string; duration_hours: string };
  setForm: (fn: (prev: any) => any) => void;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  isLoading: boolean;
  onCreateCourse: () => void;
  onDeleteCourse: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onEditCourse: (id: string) => void;
  onStudyCourse: (id: string) => void;
  onStudyHST: (id: string) => void;
  onEditBuilder: (id: string) => void;
}

function CoursesSection({
  courses, allCoursesCount, isManager, isAdmin,
  showCreateForm, setShowCreateForm, form, setForm,
  search, setSearch, statusFilter, setStatusFilter,
  isLoading, onCreateCourse, onDeleteCourse, onTogglePublish, onEditCourse, onStudyCourse,
  onStudyHST, onEditBuilder,
}: CoursesSectionProps) {
  const published = courses.filter(c => c.is_published).length;
  const drafts = courses.filter(c => !c.is_published).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Всего курсов', value: allCoursesCount, icon: ClipboardList, color: 'text-primary bg-primary/10' },
          { label: 'Опубликовано', value: courses.filter(c => c.is_published).length, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Черновики', value: courses.filter(c => !c.is_published).length, icon: Lock, color: 'text-muted-foreground bg-muted/60' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-body">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="border border-primary/20 bg-primary/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles size={13} className="text-primary" />
              </div>
              <p className="text-sm font-display font-bold text-foreground">Новый курс</p>
            </div>
            <button onClick={() => setShowCreateForm(false)} className="p-1 rounded hover:bg-accent text-muted-foreground">
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Название *
              </label>
              <Input
                value={form.title}
                onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                placeholder="Название курса..."
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Длительность (часов)
              </label>
              <Input
                type="number"
                value={form.duration_hours}
                onChange={e => setForm((p: any) => ({ ...p, duration_hours: e.target.value }))}
                placeholder="0"
                className="bg-background"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Описание
            </label>
            <Textarea
              value={form.description}
              onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
              placeholder="Краткое описание курса..."
              rows={2}
              className="bg-background resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCreateCourse}
              disabled={!form.title}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Создать курс
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-border rounded-xl text-sm font-display font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск курса..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
          />
        </div>
        <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 shrink-0">
          {(['all', 'published', 'draft', 'hst'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {{ all: 'Все', published: 'Активные', draft: 'Черновики', hst: 'HST' }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {search ? 'Ничего не найдено по запросу' : 'Курсов пока нет — создайте первый'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course, idx) => (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              isManager={isManager}
              isAdmin={isAdmin}
              onEdit={onEditCourse}
              onStudy={onStudyCourse}
              onDelete={onDeleteCourse}
              onTogglePublish={onTogglePublish}
              onStudyHST={onStudyHST}
              onEditBuilder={onEditBuilder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────
interface CourseCardProps {
  course: any;
  index: number;
  isManager: boolean;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onStudy: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onStudyHST?: (id: string) => void;   // strict ТО ЛРХ sequential mode
  onEditBuilder?: (id: string) => void; // block-based course builder
}

function CourseCard({ course, index, isManager, isAdmin, onEdit, onStudy, onDelete, onTogglePublish, onStudyHST, onEditBuilder }: CourseCardProps) {
  const pal = CARD_PALETTE[index % CARD_PALETTE.length];

  // Count total steps across all sections
  const sections: any[] = Array.isArray(course.sections) ? course.sections : [];
  const stepCount = sections.reduce((acc: number, s: any) => acc + (Array.isArray(s.steps) ? s.steps.length : 0), 0);
  const sectionCount = sections.length;

  return (
    <div
      className={`group relative bg-card border border-border rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 transition-all duration-200 cursor-pointer ${pal.border}`}
      onClick={() => isManager ? onEdit(course.id) : onStudy(course.id)}
    >
      {/* Colored top accent */}
      <div className={`h-1 bg-gradient-to-r ${pal.bar} opacity-70`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${pal.icon} flex items-center justify-center shrink-0`}>
            <Brain size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {course.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-muted-foreground font-body mb-3.5 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-display font-semibold px-2 py-0.5 rounded-full ${
            course.is_published
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {course.is_published ? '● Активный' : '○ Черновик'}
          </span>
          {course.is_hst_course && (
            <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Star size={8} /> HST
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-body pt-3 border-t border-border/60">
          {sectionCount > 0 && (
            <span className="flex items-center gap-1">
              <Layers size={11} />
              {sectionCount} модулей
            </span>
          )}
          {stepCount > 0 && (
            <span className="flex items-center gap-1">
              <ClipboardList size={11} />
              {stepCount} шагов
            </span>
          )}
          {course.duration_hours && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {course.duration_hours} ч.
            </span>
          )}
        </div>
      </div>

      {/* Hover action buttons (manager only) */}
      {isManager && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={e => { e.stopPropagation(); onTogglePublish(course.id, !course.is_published); }}
            className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
            title={course.is_published ? 'Снять с публикации' : 'Опубликовать'}
          >
            {course.is_published ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onStudy(course.id); }}
            className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Превью студента"
          >
            <BookOpen size={12} />
          </button>
          {onStudyHST && (
            <button
              onClick={e => { e.stopPropagation(); onStudyHST(course.id); }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600"
              title="Режим ТО ЛРХ (строгая прогрессия)"
            >
              <GraduationCap size={12} />
            </button>
          )}
          {onEditBuilder && (
            <button
              onClick={e => { e.stopPropagation(); onEditBuilder(course.id); }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-primary/10 text-muted-foreground hover:text-primary"
              title="Блочный конструктор"
            >
              <Layers size={12} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); if (confirm('Удалить этот курс?')) onDelete(course.id); }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      {/* Arrow indicator on hover */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>
    </div>
  );
}
